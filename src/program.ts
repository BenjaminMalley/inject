import * as ts from "typescript"
import { Node } from "./program-analyzer"

export default interface Program {
    forEachFile(visitor: (child: Node) => void): void
    forEachChild(node: Node, visitor: (child: Node) => void): void
}

export class TSProgram implements Program {
    private program: ts.Program
    constructor(program: ts.Program) {
        this.program = program
    }

    forEachFile(visitor: (child: Node) => void) {
        this.program.getSourceFiles().forEach(sourceFile => {
            if (!sourceFile.isDeclarationFile) {
                ts.forEachChild(sourceFile, visitor)
            }
        })
    }

    forEachChild(node: Node, visitor: (child: Node) => void) {
        ts.forEachChild(node, visitor)
    }
}
