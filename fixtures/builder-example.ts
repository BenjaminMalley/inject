import { Builder } from "./inject"
interface Bar {}
interface Baz {}
interface Foo extends Builder {
    bar: Bar
    baz: Baz
}
