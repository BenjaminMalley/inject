// This file demonstrates defining providers as classes that extend from
// the marker class Provider and have, by convention, a single static method
// named provide
import { Provider } from "./inject"
interface Foo {}
interface Bar {}

class BarProvider extends Provider {
    static provide(): Bar {
        return {}
    }
}

class FooProvider extends Provider {
    static provide(bar: Bar): Foo {
        return {
            ...bar,
        }
    }
}
