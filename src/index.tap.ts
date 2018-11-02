import * as ts from "typescript"
import ProgramLoader from "./index"
import * as test from "tape"
import * as path from "path"

test("ProgramLoader#getProviders should return all of the providers from a valid ts program", assert => {
    const fixturePath = path.join(__dirname, "..", "fixtures", "foo.ts")
    const program = ts.createProgram([fixturePath], {
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.CommonJS,
    })
    const loader = new ProgramLoader(program)
    const providers = loader.getProviders()
    assert.equal(providers.size, 5)
    assert.end()
})
