import * as acorn from 'acorn';
import walk = require('acorn-walk');
import { RawSourceMap } from 'source-map';
import { loader } from 'webpack';
import { RawSource, ReplaceSource, SourceMapSource } from 'webpack-sources';

const rxjsBreakpointLoader: loader.Loader = function (source: string | Buffer, sourceMap: RawSourceMap): void {
    if (this.cacheable) {
        this.cacheable();
    }
    const content = source.toString();
    // if source has no .pipe() calls or the source is from node_modules, skip
    if (!/\.pipe/.test(content) || /node_modules/.test(this.resourcePath)) {
        this.callback(null, source, sourceMap);
        return;
    }
    const result = injectBreakpointIntoPipes(this.resourcePath, content, sourceMap);
    this.callback(null, result.source, result.map);
};

exports.default = rxjsBreakpointLoader;

function injectBreakpointIntoPipes (fileName: string, originalSource: string, originalSourceMap: RawSourceMap) {
    const replaceSource = createSource(fileName, originalSource, originalSourceMap);
    const replacements = getPipeReplacements(originalSource);
    for (let replacement of replacements) {
        if (replacement.insert) {
            replaceSource.insert(replacement.position, replacement.text);
        } else {
            replaceSource.replace(replacement.start, replacement.end, replacement.text);
        }
    }
    const result = replaceSource.sourceAndMap();
    return result;
}

function createSource (fileName: string, originalSource: string, originalSourceMap: RawSourceMap): ReplaceSource {
    const source = originalSourceMap ? new SourceMapSource(originalSource, fileName, originalSourceMap) : new RawSource(originalSource);
    const replaceSource = new ReplaceSource(source, fileName);
    return replaceSource;
}

interface IPipeReplacement {
    insert: boolean;
    position: number;
    start?: number;
    end?: number;
    text: string;
}

function getPipeReplacements (originalSource: string): Array<IPipeReplacement> {
    const program = acorn.parse(originalSource, { sourceType: 'module' });
    const replacements: Array<IPipeReplacement> = [];
    // import break operator at top of file
    replacements.push(<IPipeReplacement>{ insert: true, position: 0, text: `import { breakpoint } from 'rxjs-break';\n` });
    walk.simple(program, {
        CallExpression (node: any) {
            if (!node || !node.callee || !node.arguments) {
                return;
            }
            if (!node.callee.property || node.callee.property.name !== 'pipe') {
                return;
            }
            for (let arg of node.arguments) {
                if (arg.type === 'CallExpression') {
                    let start = arg.callee.start;
                    let end = arg.callee.end;
                    let operator = originalSource.substring(start, end);
                    // do not add breakpoint for name.apply or refCount
                    if (!/\.apply$/.test(operator) && !/refCount/.test(operator)) {
                        replacements.push(<IPipeReplacement>{ insert: true, position: start, text: `breakpoint(function (cb, __type, __value) {\n` });
                        replacements.push(<IPipeReplacement>{ insert: true, position: end, text: `\n}, ${operator})` });
                        replacements.push(<IPipeReplacement>{ insert: false, position: start, start: start - 1, end: end - 1, text: 'return cb();' });
                    }
                }
            }
        }
    });
    replacements.sort((a, b) => b.position - a.position);
    return replacements;
}
