import * as ts from "typescript"

export interface Provider {
    name: string
    type: string
    parameterTypes: string[]
    returnType: string
}

export default class ProgramLoader {
    checker: ts.TypeChecker
    program: ts.Program

    providers: Set<Provider>
    providerFunctionNamePrefix = "provide"

    constructor(program: ts.Program) {
        this.program = program
        this.checker = program.getTypeChecker()
        this.providers = new Set<Provider>()
    }

    getFullyQualifiedTypeNameFromSymbol(symbol: ts.Symbol): string {
        const symbolType = this.checker.getTypeOfSymbolAtLocation(
            symbol,
            symbol.valueDeclaration
        )
        const symbolTypeName = this.checker.getFullyQualifiedName(
            symbolType.getSymbol()
        )
        return symbolTypeName
    }

    getFullyQualifiedTypeNameFromType(type: ts.Type): string {
        return this.checker.getFullyQualifiedName(type.getSymbol())
    }

    visit(node: ts.Node) {
        const { kind } = node
        if (ts.isFunctionDeclaration(node) && node.name) {
            const symbol = this.checker.getSymbolAtLocation(node.name)
            const name = symbol.getName()
            if (name.startsWith(this.providerFunctionNamePrefix)) {
                const type = this.checker.getTypeOfSymbolAtLocation(
                    symbol,
                    symbol.valueDeclaration
                )
                const signatures = type.getCallSignatures()
                const signature = signatures[0]
                this.providers.add({
                    name,
                    type: this.checker.typeToString(type),
                    parameterTypes: signature.parameters.map(param =>
                        this.getFullyQualifiedTypeNameFromSymbol(param)
                    ),
                    returnType: this.getFullyQualifiedTypeNameFromType(
                        signature.getReturnType()
                    ),
                })
            }
        }
        ts.forEachChild(node, child => this.visit(child))
    }

    getProviders(): Set<Provider> {
        this.program.getSourceFiles().forEach(sourceFile => {
            if (!sourceFile.isDeclarationFile) {
                ts.forEachChild(sourceFile, child => this.visit(child))
            }
        })
        return this.providers
    }
}
