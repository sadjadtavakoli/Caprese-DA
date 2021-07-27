algoCM_ClaSP(sequenceDatabase, minSupport, itemConstraint)



public void algoCM_ClaSP(sequenceDatabase, minSupport, itemConstraints){
    Trie frequent1Sequences = compute1SeqeunceFrequency(sequenceDatabase) // It also records last appearance of itemContraints items in each sequence. 

    Map<Item, Map<Item, Integer>> coocMap = computeCOOC(sequenceDatabase) // compute co occurance before last appearance of itemConstraints items. 
    
    dfsPruning(new Pattern(), frequent1Sequences, coocMap)
    removeNonClosedNonItemConstraintPatterns()
}


public void dfsPruning(Pattern pattern, Trie trie, Map<Item, Map<Item, Integer>> coocMap){


    firstSequenceExtensions = trie.getNodes();
    
    for (int i = 0; i < trie.getNodes().length; i++) {
        TrieNode eq = trie.getNode(i);

        exploreChildren(new Pattern(eq.getPair()), firstSequenceExtensions, firstSequenceExtensions, coocMap);
    }
}

public void exploreChildren(Pattern pattern, List<TrieNode> sequenceExtensions, List<TrieNode> itemsetsExtensions, Map<Item, Map<Item, Integer>> coocMap){

    if(HasAnExsistingSubPattern(pattern)){ //checks the existence of a subPattern in the (so far) detected patterns
        return;
    }
    if(HasAnExistingSuperPattern(pattern)){ //checks the existence of a superPattern in the (so far) detected patterns
        //update patterns list and replace subpattern with superpattern
    }
    sequences.add(sequence) // global variable sequences

    for (int i = 0; i < sequenceExtensions; i++) {
        Item item = pattern.lastItem(); 

        Integer coocurenceCount = map.get(item).get(sequenceExtensions.get(i));
        if (coocurenceCount == null || coocurenceCount < minSupport) { // Makes sure this extension has the minimum support.
                continue;
        }
        Pattern newPattern = pattern.extend(sequenceExtensions.get(i))
        if(newPattern.support < minSupport){ // Makes sure the new pattern has the minimum support.
            continue
        }
        exploreChildren(newPAttern, sequenceExtensions, itemsetsExtensions, coocMap) // recursively goes through this pattern. 
    }

    // Similar process for itemsetsExtensions
}

public removeNonClosedNonItemConstraintPatterns(){

    // Assure the detected patterns are not sub/superPattern. If so, removes subpatterns.
    // Assure all of the detected patterns include at least one items on our item-constraints. 

}
