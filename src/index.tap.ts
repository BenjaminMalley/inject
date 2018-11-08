import * as ts from "typescript"
import ProgramLoader, { topoSort, ErrorEvent, Provider } from "./index"
import * as test from "tape"
import * as path from "path"

function buildProgram(fixtureName: string): ts.Program {
    const fixturePath = path.join(__dirname, "..", "fixtures", fixtureName)
    return ts.createProgram([fixturePath], {
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.CommonJS,
    })
}

test("ProgramLoader#getProviders should return all of the providers from a valid ts program", assert => {
    const program = buildProgram("foo.ts")
    const loader = new ProgramLoader(program)
    const providers = loader.getProviders()
    assert.equal(providers.length, 5)
    assert.end()
})

test("topoSort should return a topological sort of the provider graph", assert => {
    const providers = [
        {
            name: "quux",
            type: "quux",
            parameterTypes: ["bar", "baz"],
            returnType: "quux",
        },
        {
            name: "foo",
            type: "foo",
            parameterTypes: [],
            returnType: "foo",
        },
        {
            name: "bar",
            type: "bar",
            parameterTypes: ["foo"],
            returnType: "bar",
        },
        {
            name: "baz",
            type: "baz",
            parameterTypes: ["bar"],
            returnType: "baz",
        },
    ]

    const result = topoSort(providers) as Provider[]
    assert.equal(result[0].name, "foo")
    assert.equal(result[1].name, "bar")
    assert.equal(result[2].name, "baz")
    assert.equal(result[3].name, "quux")
    assert.end()
})

test("topoSort returns an error when there are no providers without dependencies", assert => {
    const providers = [
        {
            name: "foo",
            type: "foo",
            parameterTypes: ["quux"],
            returnType: "foo",
        },
        {
            name: "bar",
            type: "bar",
            parameterTypes: ["foo"],
            returnType: "bar",
        },
    ]
    const result = topoSort(providers)
    assert.true((<ErrorEvent>result).message !== undefined)
    assert.end()
})

test("topoSort returns an error when there is a cycle", assert => {
    const providers = [
        {
            name: "foo",
            type: "foo",
            parameterTypes: [],
            returnType: "foo",
        },
        {
            name: "bar",
            type: "bar",
            parameterTypes: ["baz", "foo"],
            returnType: "bar",
        },
        {
            name: "baz",
            type: "baz",
            parameterTypes: ["bar", "foo"],
            returnType: "baz",
        },
    ]
    const result = topoSort(providers)
    assert.true((<ErrorEvent>result).message !== undefined)
    assert.end()
})
