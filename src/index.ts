import * as ts from "typescript"

export interface Provider {
    name: string
    type: string
    parameterTypes: string[]
    returnType: string
}

export interface Link {
    from: string
    to: Provider
}

export interface ErrorEvent {
    message: string
}

export default class ProgramLoader {
    checker: ts.TypeChecker
    program: ts.Program

    providers: Provider[]
    providerFunctionNamePrefix = "provide"

    constructor(program: ts.Program) {
        this.program = program
        this.checker = program.getTypeChecker()
        this.providers = []
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
                this.providers.push({
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

    getProviders(): Provider[] {
        this.program.getSourceFiles().forEach(sourceFile => {
            if (!sourceFile.isDeclarationFile) {
                ts.forEachChild(sourceFile, child => this.visit(child))
            }
        })
        return this.providers
    }
}

export function hasNoDependencies(provider: Provider): boolean {
    return provider.parameterTypes.length === 0
}

export function getEdges(providers: Provider[]): Link[] {
    return providers.flatMap(provider => {
        return provider.parameterTypes.map(parameterType => {
            return {
                from: parameterType,
                to: provider,
            }
        })
    })
}

export function topoSort(providers: Provider[]): Provider[] | ErrorEvent {
    const s = providers.filter(hasNoDependencies)
    const l = []
    if (s.length === 0) {
        return {
            message: "Could not find start nodes",
        }
    }
    while (s.length > 0) {
        const n = s.pop()
        l.push(n)
        providers
            .filter(m => m.parameterTypes.includes(n.returnType))
            .forEach(m => {
                m.parameterTypes.splice(
                    m.parameterTypes.indexOf(n.returnType),
                    1
                )
                if (hasNoDependencies(m)) {
                    s.push(m)
                }
            })
    }
    const hasEdges = providers.some(
        provider => provider.parameterTypes.length > 0
    )
    if (hasEdges) {
        return {
            message: "Cycle identified",
        }
    }
    return l
}
