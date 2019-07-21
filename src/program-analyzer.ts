import * as ts from "typescript"

export type Node = ts.Node
export type Type = ts.Type

export default interface ProgramAnalyzer {
    // We only make a single pass through the AST, so we won't know if the given node is a Provider node
    // until we can check the type id of the heritageClause against the Provider base class.
    // Instead we will use a name heuristic to collect all nodes that are potentially provider nodes.
    asPotentialBuilder(node: ts.Node): Node | null
    asPotentialProvider(node: ts.Node): Node | null
    asBuilderMarker(node: ts.Node): Type | null
    asProviderMarker(node: ts.Node): Type | null
    isProvider(node: Node, providerType: Type): boolean
    isBuilder(node: Node, builderType: Type): boolean
}

export class TSProgramAnalyzer implements ProgramAnalyzer {
    private checker: ts.TypeChecker
    constructor(checker: ts.TypeChecker) {
        this.checker = checker
    }

    private getFullyQualifiedTypeNameFromSymbol(symbol: ts.Symbol): string {
        const symbolType = this.checker.getTypeOfSymbolAtLocation(
            symbol,
            symbol.valueDeclaration
        )
        const symbolTypeName = this.checker.getFullyQualifiedName(
            symbolType.getSymbol()
        )
        return symbolTypeName
    }

    private getFullyQualifiedTypeNameFromType(type: ts.Type): string {
        return this.checker.getFullyQualifiedName(type.getSymbol())
    }

    // heuristic to rule out Providers & Builders that do not extend/implement Provider/Builder by name
    private heritageClausesMatchTypeByName(
        clauses: ts.NodeArray<ts.HeritageClause>,
        typeNameToMatch: string
    ): boolean {
        return clauses.some(
            (clause: ts.HeritageClause): boolean => {
                if (
                    clause.token === ts.SyntaxKind.ExtendsKeyword &&
                    clause.types.length === 1
                ) {
                    const type = clause.types[0]
                    const t = this.checker.getTypeAtLocation(type.expression)
                    return this.checker.typeToString(t) === typeNameToMatch
                }
            }
        )
    }

    private heritageClausesMatchTypeExactly(
        clauses: ts.NodeArray<ts.HeritageClause>,
        typeToMatch: Type
    ): boolean {
        return clauses.some(
            (clause: ts.HeritageClause): boolean => {
                return clause.types
                    .map(t => this.checker.getTypeAtLocation(t.expression))
                    .some((clauseType: ts.Type) => {
                        console.log(clauseType, typeToMatch)
                        clauseType === typeToMatch
                    })
            }
        )
    }

    private getHeritageClauses(node: ts.Node): ts.NodeArray<ts.HeritageClause> {
        if (ts.isInterfaceDeclaration(node)) {
            const {
                heritageClauses = ts.createNodeArray(),
            }: {
                heritageClauses?: ts.NodeArray<ts.HeritageClause>
            } = node
            return heritageClauses
        }
        if (ts.isClassDeclaration(node)) {
            const {
                heritageClauses = ts.createNodeArray(),
            }: {
                heritageClauses?: ts.NodeArray<ts.HeritageClause>
            } = node
            return heritageClauses
        }
        return ts.createNodeArray()
    }

    asPotentialBuilder(node: ts.Node): Node | null {
        const heritageClauses = this.getHeritageClauses(node)
        const matches = this.heritageClausesMatchTypeByName(
            heritageClauses,
            "Builder"
        )
        return matches ? node : null
    }

    asPotentialProvider(node: ts.Node): Node | null {
        const heritageClauses = this.getHeritageClauses(node)
        const matches = this.heritageClausesMatchTypeByName(
            heritageClauses,
            "Provider"
        )
        return matches ? node : null
    }

    asBuilderMarker(node: ts.Node): Type | null {
        if (
            ts.isInterfaceDeclaration(node) &&
            node.name.escapedText === "Builder" &&
            node.members.length === 0
        ) {
            const type = this.checker.getTypeAtLocation(node)
            return type
        }
    }

    asProviderMarker(node: ts.Node): Type | null {
        if (
            ts.isClassDeclaration(node) &&
            node.name.escapedText === "Provider" &&
            node.members.length === 0
        ) {
            const type = this.checker.getTypeAtLocation(node)
            return type
        }
    }

    isProvider(node: Node, providerType: Type): boolean {
        const heritageClauses = this.getHeritageClauses(node)
        return this.heritageClausesMatchTypeExactly(
            heritageClauses,
            providerType
        )
    }

    isBuilder(node: Node, builderType: Type): boolean {
        const heritageClauses = this.getHeritageClauses(node)
        return this.heritageClausesMatchTypeExactly(
            heritageClauses,
            builderType
        )
    }
}
