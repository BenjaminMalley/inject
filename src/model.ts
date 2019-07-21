import * as ts from "typescript"

export interface Builder {}

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

export interface Logger {
    warn(...data: any): void
    info(...data: any): void
    debug(...data: any): void
    error(...data: any): void
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

interface InternalProviderNode extends ts.FunctionDeclaration {
    symbol: ts.Symbol
    symbolName: string
}
