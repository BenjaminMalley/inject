interface Bar {}
interface Foo {}

// Bar is expected to be provided at runtime.
export function provideFoo(bar: Bar): Foo {
    return {}
}
