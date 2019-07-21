import * as path from "path"
import * as test from "tape"
import * as ts from "typescript"
import DependencyGraphBuilder from "./dependency-graph-builder"
import { TSProgramAnalyzer } from "./program-analyzer"
import { TSProgram } from "./program"
import { Provider, ProviderNode, Logger } from "./model"

function buildProgram(fixtureName: string): ts.Program {
    const fixturePath = path.join(__dirname, "..", "fixtures", fixtureName)
    return ts.createProgram([fixturePath], {
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.CommonJS,
    })
}

class NullLogger implements Logger {
    warn(...data: any): void {}
    info(...data: any): void {}
    debug(...data: any): void {
        console.log(...data)
    }
    error(...data: any): void {}
}

test(
    "A program which extends the Provider class should be able to return providers"
)

test("DependencyGraph should convert a valid program into a DependencyGraph", assert => {
    const program = buildProgram("provider-example.ts")
    const checker = program.getTypeChecker()
    const builder = new DependencyGraphBuilder()
        .setProgram(new TSProgram(program))
        .setAnalyzer(new TSProgramAnalyzer(checker))
    //assert.false(builder.buildDependencyGraph() instanceof Error)
    assert.equal(builder.build(), new Error(""))
    assert.end()
})

/*
interface TestNode {
    name: string
    type: string
    parameterTypes: string[]
    returnType: string
}

function buildProviderNode(testNode: TestNode): ProviderNode {
    const providerNode = new ProviderNode(testNode)
    providerNode.providedDependencyTypes = providerNode.parameterTypes
    return providerNode
}

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
    ].map(buildProviderNode)

    const result = topoSort(providers) as ProviderNode[]
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
    ].map(buildProviderNode)
    const result = topoSort(providers)
    assert.true((<Error>result).message !== undefined)
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
    ].map(buildProviderNode)
    const result = topoSort(providers)
    assert.true((<Error>result).message !== undefined)
    assert.end()
})

test("DependencyProvider#categorizeDependenciesByType should place dependencies into the correct category", assert => {
    const providers = [
        {
            name: "foo",
            type: "foo",
            // baz is a runtime dependency
            parameterTypes: ["baz"],
            returnType: "foo",
        },
        {
            name: "bar",
            type: "bar",
            parameterTypes: ["foo"],
            returnType: "bar",
        },
    ].map(provider => new ProviderNode(provider))
    DependencyGraph.categorizeDependenciesByType(providers)
    const foo = providers.find(provider => provider.name === "foo")
    assert.equal(foo.runtimeDependencyTypes.length, 1)
    assert.equal(foo.runtimeDependencyTypes[0], "baz")
    assert.equal(foo.providedDependencyTypes.length, 0)
    const bar = providers.find(provider => provider.name === "bar")
    assert.equal(bar.providedDependencyTypes.length, 1)
    assert.equal(bar.providedDependencyTypes[0], "foo")
    assert.equal(bar.runtimeDependencyTypes.length, 0)
    assert.end()
})

test("Builders", assert => {
    const program = buildProgram("builder-example.ts")
    const loader = new ProgramLoader(program)
    loader.getProviders()
    assert.end()
})
*/
