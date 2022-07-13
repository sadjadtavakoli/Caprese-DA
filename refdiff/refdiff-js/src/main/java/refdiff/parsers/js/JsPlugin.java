package refdiff.parsers.js;

import java.io.Closeable;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.eclipsesource.v8.NodeJS;
import com.eclipsesource.v8.V8Object;

import org.eclipse.jgit.errors.LargeObjectException;

import refdiff.core.io.FilePathFilter;
import refdiff.core.io.SourceFile;
import refdiff.core.io.SourceFileSet;
import refdiff.core.cst.HasChildrenNodes;
import refdiff.core.cst.Location;
import refdiff.core.cst.CstNode;
import refdiff.core.cst.CstNodeRelationship;
import refdiff.core.cst.CstNodeRelationshipType;
import refdiff.core.cst.CstRoot;
import refdiff.core.cst.TokenPosition;
import refdiff.core.cst.TokenizedSource;
import refdiff.parsers.LanguagePlugin;

public class JsPlugin implements LanguagePlugin, Closeable {

	private NodeJS nodeJs;
	private int nodeCounter = 0;
	private File nodeModules;
	private V8Object babel;

	public JsPlugin() throws Exception {
		this.nodeJs = NodeJS.createNodeJS();
		nodeModules = new File(
				"/Users/sadjadtavakoli/University/lab/libraries/RefDiff/refdiff-js/src/main/resources/node_modules");
		this.babel = this.nodeJs.require(new File(nodeModules, "@babel/parser"));

		this.nodeJs.getRuntime().add("babelParser", this.babel);

		String plugins = "['jsx', 'objectRestSpread', 'exportDefaultFrom', 'exportNamespaceFrom', 'classProperties', 'flow', 'dynamicImport', 'decorators', 'optionalCatchBinding']";

		this.nodeJs.getRuntime().executeVoidScript(
				"function parse(script) {return babelParser.parse(script, {ranges: true, tokens: true, sourceType: 'unambiguous', allowImportExportEverywhere: true, allowReturnOutsideFunction: true, plugins: "
						+ plugins + " });}");
		this.nodeJs.getRuntime().executeVoidScript("function toJson(object) {return JSON.stringify(object);}");
	}

	@Override
	public CstRoot parse(SourceFileSet sources, Set<String> nonValidChangedFiles) throws Exception {
		CstRoot root = new CstRoot();
		this.nodeCounter = 0;
		for (SourceFile sourceFile : sources.getSourceFiles()) {
			if (getAllowedFilesFilter().isAllowedToBeTokenized(sourceFile.getPath())) {
				String content = "";
				try {
					content = sources.readContent(sourceFile);
				} catch (LargeObjectException e) {
					if (nonValidChangedFiles != null)
						nonValidChangedFiles.add(sourceFile.getPath());
					continue;
				}
				try {
					getCst(root, sourceFile, content, sources, nonValidChangedFiles);
				} catch (Exception e) {
					throw new RuntimeException(e);
				}
			} else {
				if (nonValidChangedFiles != null)
					nonValidChangedFiles.add(sourceFile.getPath());
			}

		}
		return root;
	}

	private void getCst(CstRoot root, SourceFile sourceFile, String content, SourceFileSet sources,
			Set<String> nonValidChangedFiles) throws Exception {
		try {
			V8Object babelAst = (V8Object) this.nodeJs.getRuntime().executeJSFunction("parse", content);
			try (JsValueV8 astRoot = new JsValueV8(babelAst, this::toJson)) {
				TokenizedSource tokenizedSource = buildTokenizedSourceFromAst(sourceFile, astRoot);
				root.addTokenizedFile(tokenizedSource);
				Map<String, Set<CstNode>> callerMap = new HashMap<>();
				getCst(0, root, sourceFile, content, astRoot, callerMap);

				root.forEachNode((calleeNode, depth) -> {
					if (calleeNode.getType().equals(JsNodeType.FUNCTION)
							&& callerMap.containsKey(calleeNode.getLocalName())) {
						Set<CstNode> callerNodes = callerMap.get(calleeNode.getLocalName());
						for (CstNode callerNode : callerNodes) {
							root.getRelationships().add(new CstNodeRelationship(CstNodeRelationshipType.USE,
									callerNode.getId(), calleeNode.getId()));
						}
					}
				});
			}

		} catch (Exception e) {
			if (nonValidChangedFiles != null) {
				nonValidChangedFiles.add(sourceFile.getPath());
			}
			// throw new RuntimeException(
			// String.format("Error parsing %s: %s", sources.describeLocation(sourceFile),
			// e.getMessage()), e);

		}
	}

	private TokenizedSource buildTokenizedSourceFromAst(SourceFile sourceFile, JsValueV8 astRoot) {
		JsValueV8 tokensArray = astRoot.get("tokens");

		List<TokenPosition> tokens = new ArrayList<>();
		for (int i = 0; i < tokensArray.size(); i++) {
			JsValueV8 tokenObj = tokensArray.get(i);
			int start = tokenObj.get("start").asInt();
			int end = tokenObj.get("end").asInt();
			if (end > start) {
				tokens.add(new TokenPosition(start, end));
			}
		}
		TokenizedSource tokenizedSource = new TokenizedSource(sourceFile.getPath(), tokens);
		return tokenizedSource;
	}

	private void getCst(int depth, HasChildrenNodes container, SourceFile sourceFile, String fileContent,
			JsValueV8 babelAst, Map<String, Set<CstNode>> callerMap) throws Exception {
		if (!babelAst.has("type")) {
			throw new RuntimeException("object is not an AST node");
		}
		String path = sourceFile.getPath();
		String type = babelAst.get("type").asString();
		List<JsValueV8> children = null;

		if (BabelNodeHandler.RAST_NODE_HANDLERS.containsKey(type)) {
			BabelNodeHandler handler = BabelNodeHandler.RAST_NODE_HANDLERS.get(type);

			if (handler.isCstNode(babelAst)) {
				JsValueV8 mainNode = handler.getMainNode(babelAst);

				int begin = mainNode.get("start").asInt();
				int end = mainNode.get("end").asInt();
				int bodyBegin = begin;
				int bodyEnd = end;

				CstNode cstNode = new CstNode(++nodeCounter);
				cstNode.setType(handler.getType(babelAst));
				JsValueV8 bodyNode = handler.getBodyNode(babelAst);
				if (bodyNode.isDefined()) {
					if (bodyNode.has("range")) {
						bodyBegin = bodyNode.get("start").asInt();
						bodyEnd = bodyNode.get("end").asInt();
						if (bodyNode.get("type").asString().equals("BlockStatement")) {
							bodyBegin = bodyBegin + 1;
							bodyEnd = bodyEnd - 1;
						}
					}
				}

				cstNode.setLocation(Location.of(path, begin, end, bodyBegin, bodyEnd, fileContent));
				cstNode.setLocalName(handler.getLocalName(cstNode, babelAst));
				cstNode.setSimpleName(handler.getSimpleName(cstNode, babelAst));
				cstNode.setNamespace(handler.getNamespace(cstNode, babelAst));
				cstNode.setStereotypes(handler.getStereotypes(cstNode, babelAst));
				cstNode.setParameters(handler.getParameters(cstNode, babelAst));
				container.addNode(cstNode);
				container = cstNode;
				children = Collections.singletonList(bodyNode);
			}
		} else if ("CallExpression".equals(type)) {
			extractCalleeNameFromCallExpression(babelAst, callerMap, (CstNode) container);
		}

		if (children == null) {
			children = new ArrayList<>();
			for (String key : babelAst.getOwnKeys()) {
				if (!key.equals("tokens")) {
					children.add(babelAst.get(key));
				}
			}
		}

		for (JsValueV8 value : children) {
			if (value.isObject()) {
				if (value.has("type")) {
					getCst(depth + 1, container, sourceFile, fileContent, value, callerMap);
				}
			}
			if (value.isArray()) {
				for (int i = 0; i < value.size(); i++) {
					JsValueV8 element = value.get(i);
					if (element.has("type")) {
						getCst(depth + 1, container, sourceFile, fileContent, element, callerMap);
					}
				}
			}
		}
	}

	private void extractCalleeNameFromCallExpression(JsValueV8 callExpresionNode, Map<String, Set<CstNode>> callerMap,
			CstNode container) {
		JsValueV8 callee = callExpresionNode.get("callee");
		if (callee.get("type").asString().equals("MemberExpression")) {
			JsValueV8 property = callee.get("property");
			if (property.get("type").asString().equals("Identifier")) {
				String calleeName = property.get("name").asString();
				callerMap.computeIfAbsent(calleeName, key -> new HashSet<>()).add(container);
			} else {
				// callee is a complex expression, not an identifier
			}
		} else if (callee.get("type").asString().equals("Identifier")) {
			String calleeName = callee.get("name").asString();
			callerMap.computeIfAbsent(calleeName, key -> new HashSet<>()).add(container);
		} else {
			// callee is a complex expression, not an identifier
		}
	}

	private String toJson(Object object) {
		return this.nodeJs.getRuntime().executeJSFunction("toJson", object).toString();
	}

	@Override
	public FilePathFilter getAllowedFilesFilter() {
		// TODO sadjad JsPlugin reads all of these files and tries to tokenize them. To
		// prevent redundant reading of non js files, we could have another
		// filter working in parallel just for suppoerted formats for
		// changes.
		return new FilePathFilter(Arrays.asList(".js", ".ts", ".jsx", ".md", ".json", ".yml", ".lock", ".ts", ".html",
				".sql", ".txt", ".xmi", ".jade", ".tmpl", ".ejs", ".svg", ".c", ".cpp", ".java", ".h", ".m", ".mm",
				".M", ".py", ".sh", ".php", ".rb"), Arrays.asList(".ts", ".js", ".jsx"), Arrays.asList(".min.js"));
	}

	@Override
	public void close() throws IOException {
		this.babel.release();
		// this.nodeJs.getRuntime().release(true);
		this.nodeJs.release();
	}
}
