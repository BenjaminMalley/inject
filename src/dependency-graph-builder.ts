import { Provider, Builder, Logger, ProviderNode } from "./model"
import DependencyGraph from "./dependency-graph"
import ProgramAnalyzer, { Node, Type } from "./program-analyzer"
import Program from "./program"

export default class DependencyGraphBuilder {
    private program: Program
    private analyzer: ProgramAnalyzer

    private providers: Provider[] = []
    private builders: Builder[] = []

    private potentialProviders: Node[] = []
    private potentialBuilders: Node[] = []

    private providerType: Type | null = null
    private builderType: Type | null = null

    setProgram(program: Program): DependencyGraphBuilder {
        this.program = program
        return this
    }

    setAnalyzer(analyzer: ProgramAnalyzer): DependencyGraphBuilder {
        this.analyzer = analyzer
        return this
    }

    private visit = (node: Node) => {
        const potentialProvider = this.analyzer.asPotentialProvider(node)
        if (potentialProvider !== null) {
            this.potentialProviders.push(potentialProvider)
        }
        const potentialBuilder = this.analyzer.asPotentialBuilder(node)
        if (potentialBuilder !== null) {
            this.potentialBuilders.push(potentialBuilder)
        }
        const builderType = this.analyzer.asBuilderMarker(node)
        if (builderType) {
            this.builderType = builderType
        }
        const providerType = this.analyzer.asProviderMarker(node)
        if (providerType) {
            this.providerType = providerType
        }
        this.program.forEachChild(node, this.visit)
    }

    private getProviders(): Provider[] | Error {
        this.program.forEachFile(this.visit)
        if (this.providerType == null) {
            return new Error(
                "Did not locate any valid providers. Please import and use the Provider interface"
            )
        }
        if (this.builderType == null) {
            return new Error(
                "Did not locate any valid builders. Please import and use the Builder interface"
            )
        }
        this.potentialProviders.reduce((providers, potentialProvider) => {
            return providers
        }, this.providers)
        this.potentialBuilders.reduce((builders, potentialBuilder) => {
            return builders
        }, this.builders)
        return this.providers
    }

    build(): DependencyGraph | Error {
        if (this.program === null) {
            return new Error(
                "Valid program is required to build a dependency graph. Use #setProgram"
            )
        }
        if (this.analyzer === null) {
            return new Error(
                "Valid ProgramAnalyzer is required to build a dependency graph. Use #setAnalyzer"
            )
        }
        const providersResult = this.getProviders()
        if (providersResult instanceof Error) {
            return providersResult
        }
        return DependencyGraph.buildWithNodes(
            providersResult.map(provider => new ProviderNode(provider))
        )
    }
}
