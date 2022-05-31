package refdiff.core.diff;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

import refdiff.core.cst.CstRoot;

/**
 * A CstDiff represents the relationships between nodes of two CST's.
 * Relationships are usually refactorings applied between revisions.
 * 
 * @see RelationshipType
 */
public class CstDiff {
	
	private final CstRoot before;
	private final CstRoot after;
	private final Set<Relationship> relationships = new HashSet<>();
	private Set<String> addedEntitiesKeys;	
	private Set<String> changedEntitiesKeys;
	private Set<String> removedEntitiesKeys;
	public CstDiff(CstRoot before, CstRoot after) {
		this.before = before;
		this.after = after;
	}
	
	/**
	 * @return The CST of the revision before the change.
	 */
	public CstRoot getBefore() {
		return before;
	}
	
	/**
	 * @return The CST of the revision after the change.
	 */
	public CstRoot getAfter() {
		return after;
	}
	
	/**
	 * @return The set of relationships between nodes of the CST's (before and after). Relationships are usually 
	 * refactorings applied between revisions.
	 */
	public Set<Relationship> getRelationships() {
		return Collections.unmodifiableSet(relationships);
	}
	
	/**
	 * Add a relationship in the CST diff.
	 * 
	 * @param relationship The relationship to add.
	 */
	public void addRelationships(Relationship relationship) {
		relationships.add(relationship);
	}
	
	public void setChangedEntitiesKeys(Set<String> changed){
		this.changedEntitiesKeys = changed;
	}

	public void setAddedEntitiesKeys(Set<String> added){
		this.addedEntitiesKeys = added;
	}
	
	public void setRemovedEntitiesKeys(Set<String> removed){
		this.removedEntitiesKeys = removed;
	}
	
	public Set<String> getChangedEntitiesKeys(){
		return this.changedEntitiesKeys;
	}

	public Set<String> getAddedEntitiesKeys() {
		return this.addedEntitiesKeys;
	}

	public Set<String> getRemovedEntitiesKeys() {
		return this.removedEntitiesKeys;
	}

	/**
	 * @return The set of refactoring relationships between nodes of the CST's (before and after).
	 */
	public Set<Relationship> getRefactoringRelationships() {
		return relationships.stream()
			.filter(Relationship::isRefactoring)
			.collect(Collectors.toSet());
	}

	public String toJsonString(){

		String json = "{";
		if (!changedEntitiesKeys.isEmpty()) {
			json = json.concat("\"changes\" : [");

			for (String node : changedEntitiesKeys) {
				json = json.concat(node.concat(","));
			}
			json = json.substring(0, json.length() - 1);
			json = json.concat("]");
			if(!addedEntitiesKeys.isEmpty()){
				json = json.concat(",");
			}
		}

		if (!addedEntitiesKeys.isEmpty()) {
			json = json.concat("\"added\" : [");
			for (String node : addedEntitiesKeys) {
				json = json.concat(node.concat(","));
			}
			json = json.substring(0, json.length() - 1);
			json = json.concat("]");
		}
		
		json = json.concat("}");
		return json;

	}
}
