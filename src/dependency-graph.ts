import { ProviderNode, Node } from "./model"

export default class DependencyGraph {
    nodes: ProviderNode[]

    private static topoSort<A, B extends Node<A>>(nodes: B[]): B[] | Error {
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

    static buildWithNodes(nodes: ProviderNode[]): DependencyGraph | Error {
        DependencyGraph.categorizeDependenciesByType(nodes)
        const result = DependencyGraph.topoSort(nodes)
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
