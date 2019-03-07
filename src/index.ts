import * as ts from "typescript"

export class Provider {
    astNode?: ts.Node
    name: string
    type: string
    parameterTypes: string[]
    returnType: string
}

export interface Node<A> {
    hasNoIncomingEdges(): boolean
    hasIncomingEdgeOn(incoming: Node<A>): boolean
    removeIncomingEdgeOn(incoming: Node<A>): null
    getValue(): A
}

export class ProviderNode implements Provider, Node<string> {
    astNode: ts.Node
    name: string
    type: string
    parameterTypes: string[] = []
    returnType: string
    runtimeDependencyTypes: string[] = []
    providedDependencyTypes: string[] = []

    constructor(provider: Provider) {
        this.name = provider.name
        this.type = provider.type
        this.parameterTypes = provider.parameterTypes
        this.returnType = provider.returnType
    }

    hasNoIncomingEdges() {
        return this.providedDependencyTypes.length === 0
    }

    hasIncomingEdgeOn(incoming: Node<string>): boolean {
        return this.providedDependencyTypes.includes(incoming.getValue())
    }

    removeIncomingEdgeOn(incoming: Node<string>): null {
        this.providedDependencyTypes.splice(
            this.providedDependencyTypes.indexOf(incoming.getValue()),
            1
        )
        return null
    }

    getValue(): string {
        return this.returnType
    }
}

export interface Link {
    from: string
    to: Provider
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
                    astNode: node,
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

    buildDependencyProvider(): DependencyGraph | Error {
        return DependencyGraph.buildWithNodes(
            this.getProviders().map(provider => new ProviderNode(provider))
        )
    }
}

export class DependencyGraph {
    nodes: ProviderNode[]

    static buildWithNodes(nodes: ProviderNode[]): DependencyGraph | Error {
        DependencyGraph.categorizeDependenciesByType(nodes)
        const result = topoSort(nodes)
        if (result instanceof Error) {
            return result
        }
        const depProvider = new DependencyGraph()
        depProvider.nodes = result
        return depProvider
    }

    public static categorizeDependenciesByType(nodes: ProviderNode[]) {
        const providerTypes = nodes.reduce((types, provider) => {
            types.add(provider.getValue())
            return types
        }, new Set<string>())

        nodes.forEach(provider => {
            provider.parameterTypes.forEach(dependency => {
                if (providerTypes.has(dependency)) {
                    provider.providedDependencyTypes.push(dependency)
                } else {
                    provider.runtimeDependencyTypes.push(dependency)
                }
            })
        })
    }
}

export function topoSort<A, B extends Node<A>>(nodes: B[]): B[] | Error {
    const s = nodes.filter(node => node.hasNoIncomingEdges())
    const l = []
    if (s.length === 0) {
        return new Error("Could not find start nodes")
    }
    while (s.length > 0) {
        const n = s.pop()
        l.push(n)
        nodes.filter(m => m.hasIncomingEdgeOn(n)).forEach(m => {
            m.removeIncomingEdgeOn(n)
            if (m.hasNoIncomingEdges()) {
                s.push(m)
            }
        })
    }
    const hasEdges = nodes.some(provider => !provider.hasNoIncomingEdges())
    if (hasEdges) {
        return new Error("Cycle identified")
    }
    return l
}
