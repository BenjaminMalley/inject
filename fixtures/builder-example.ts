import { Builder } from "./inject"
import "./provider-example"

interface Bar {}
interface Baz {}
interface Foo extends Builder {
    bar: Bar
    baz: Baz
}
