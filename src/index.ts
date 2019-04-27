import {
    MonoTypeOperatorFunction,
    Observable,
    Operator,
    Subscriber,
    TeardownLogic
} from 'rxjs';

export type BreakpointCallback<T> = (cb: () => void, type: string, valueOrErr?: T | any) => void;

export function breakpoint<T> (callback: BreakpointCallback<T>, operator: MonoTypeOperatorFunction<T>) {
    return function breakpointArgsFunction (): MonoTypeOperatorFunction<T> {
        const operatorFunc = (<any>operator).apply(null, arguments);
        return function breakpointOperatorFunction (source: Observable<T>): Observable<T> {
            const interceptSource = source.lift(new BreakpointOperator(callback));
            return operatorFunc(interceptSource);
        };
    };
}

class BreakpointOperator<T> implements Operator<T, T> {
    constructor (private _callback: BreakpointCallback<T>) {
    }

    public call (subscriber: Subscriber<T>, source: any): TeardownLogic {
        return source.subscribe(new BreakpointSubscriber(subscriber, this._callback));
    }
}

class BreakpointSubscriber<T> extends Subscriber<T> {
    constructor (destination: Subscriber<T>, private _callback: BreakpointCallback<T>) {
        super(destination);
    }

    protected _next (value: T) {
        this._callback(() => this.destination.next!(value), 'next', value);
    }

    protected _error (err: any) {
        this._callback(() => this.destination.error!(err), 'error', err);
    }

    protected _complete () {
        return this._callback(() => this.destination.complete!(), 'complete');
    }
}
