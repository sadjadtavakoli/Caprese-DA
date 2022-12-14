
function main(){
    minumumConfidence = 0.5;
    enoughConfidence = 0.5;
    changeSet = [...];
    sequenceSet = loadCommits();
    coocMap = computeCooc()
    extensionNodes = sequenceSet.getAllFunction();

    runAlgorithm(extensionNodes, coocMap, changeSet, minimumConfidence, enoughConfidence);
    pruneImpactSet();

}

function runAlgorithm(extensionNodes, coocMap, changeSet, minimumConfidence, enoughConfidence){
    
    // For each observed functions of the sequences, sorted lexicographicaly
    for (node in extensionNodes) {

        /*
        * If node is already detected with a confidence greather than the given enoughConfidence,
        * the algorithm skips it and continues the iteration with the next node. 
        */
        if(detectedFunctions.get(node).getConfidence() >= enoughConfidence){
            continue;
        }
        
        // The algorithm begins with patterns with length 1 consisted of the given extension nodes.
        pattern = {node};
    
        /*
        * The algorithm calls extendPattern to produce new patterns and find the impacted function. 
        * This function gets a pattern of length one and the extension nodes after the current item to create new patterns.
        */
        extendPattern(pattern, extensionNodes[node:end], changeSet, coocMap, minimumConfidence, enoughConfidence);
    }
}
    
function extendPattern(pattern, extensionNodes, changeSet, coocMap, minimumConfidence, enoughConfidence){

    /*
    * The algorithm checks if the given pattern can be skipped using prune methods backward
    * subpattern or backward superpattern of the patterns that have been extended so far.
    */ 
    if (checkAvoidance(pattern)) {
        return;
    }

    lastExtensionIntersection = getLastChangeSet(extensionNodes)
    lastExtensionRegularfunction = getLastRegularFunction(extensionNodes)

    // Initialization of new sets
    newPatternsToExtend = [];
    newExtensions = [];

    for(extensionNode in extensionNodes) {
        
        // This value indicates that the extension node is in the given ChangeSet
        extensionNodeInChangeSet = changeSet.contains(extensionNode);

        /*
        * The algorithm checks whether the extension node is ever observed after the 
        * last function of the pattern or not. If not so, the algorithm continues the extension with the next node.
        * The algorithm also checks whether or not the extension node is already detected with 
        * the confidence more than the given enough confidence. If so, the algorithm skips it. 
        */
        Cooccurred = coocMap.get(pattern.lastFunction, extensionNode);
        if (!Cooccurred || detectedFunctions.get(extensionNode).getConfidence() >= enoughConfidence) {
                continue;
        }

        // The algorithm creates a new pattern by adding the extension node the given pattern
        newPattern = pattern + extensionNode

        // Then, it computes the new pattern's intersection with the changeSet functions
        newPatternIntersection = getIntersection(newPattern, changeSet);

        /*
        * Based on the computed intersection, the algorithm computes the new pattern's confidence by
        * dividing the new pattern's support and the intersection's. 
        */
        newPatternConfidence = newPatternIntersection.getSupport()>0 ? newPattern.getSupport() / newPatternIntersection.getSupport() : -1;

        /*
        * If the new pattern's confidence is greater than the given minimumConfidence
        * we update extension node's and the undetectedFunctions included in that pattern's 
        * information. 
        */
        if(newPatternConfidence >= minimumConfidence){

            if(!extensionNodeInChangeSet){
                /*
                * Since the extension node is not in the given changeSet, the new pattern's score is definitely less than the older one.
                * So, the algorithm only updates the extension node's confidence
                */  
                updateDetectedEntitiesInfo(newPatternConfidence, newPattern.getSupport(), extensionNode, newPatternIntersection);
            }else{
                for(functionID in pattern.getUndetectedFunctions()){
                    updateDetectedEntitiesInfo(newPatternConfidence, newPattern.getSupport(), functionID, newPatternIntersection);
                }
            }
        }


        // If there is still at least one changeSet function to extend the new pattern
        if(extensionNode<lastExtensionIntersection){
            /*
            * And if the extension node is in item constrains or it's score is less than 
            * the given minimum confidence, the algorithm keeps the new pattern for furtuer extensions.
            */
            if(extensionNodeInChangeSet || newPatternConfidence < minimumConfidence){
                newPatternsToExtend.add(extension);
            }
        /*
        * Also, suppose the extension node is the last changeSet function. In that case, 
        * the algorithm keeps the new pattern for the further extension only if 
        * its confidence exceeds the given minimum confidence.  
        */
        }else if(extensionNode==lastExtensionIntersection && newPatternConfidence >= minimumConfidence){
            newPatternsToExtend.add(extension);
        }

        /*
        * The algorithm keeps the extension node for the next level of extension only if two conditions
        * First, if its in the given ChangeSet function.
        * Second, if there is at leat one changeSet function in the given extension nodes, and the new pattern's 
        * confidence is less the enoughConfidence. 
        */
        if (extensionNodeInChangeSet || (lastExtensionIntersection && newPatternConfidence < enoughConfidence)) {
            newExtensions.add(extensionNode);
        }

        /*
        * If the new pattern's confidence is enough, and no more regular functions remain to detect, 
        * the algorithm ceases the iteration and goes to the next step. 
        */
        if(extensionNode>=lastExtensionRegularfunction && newPatternConfidence>=enoughConfidence){
            break;
        }
    }



    newExtensionLastChangeSetItem = getLastChangeSetIndex(newExtensions);

    /*
    * The algorithm iterates over the patterns kept for extension.
    */
    for (newPattern in newPatterns) {

        /*
        * If newPattern does not have any functions with confidence less than enough and no functions with confidence remain
        * in the nex extensionNodes, the algorithm breaks the iteration and stops any further extensions. 
        */
        if(newPattern.getUndetectedFunctions().isEmpty() && getUndetectedRegularFunctions(newExtensions).isEmpty()){
            break;
        }

        /*
        * If newPattern does not include any changeSet functions, and also its last function
        * is greater than the last changeSet function, the algorithm breaks the iteration and 
        * stops any further extensions. 
        */
        if (getIntersection(newPattern, changeSet).isEmpty() &&  newPattern.lastFunction >= newExtensionLastChangeSetItem) {
            break;
        }

        // The algorithm recursively calls extendPattern function on the new pattern with extension nodes greater
        // than its last function
        extendPattern(newPattern, newExtensions[newPattern.lastFunction:end], changeSet, coocMap, minimumConfidence, enoughConfidence);
    }
}

/**
* For each item foo after a function bar in the same sequence we add a true value 
* to the row foo and column var. This value indicates foo occured after bar in a sequence.
*/
function computeCooc(sequenceSet){
    coocMap =  map();
    for (seq in sequenceSet) {
        for (j = 0; j < seq.size(); j++) {
            functionA = seq[j];
            for (k = j + 1; k < seq.size(); k++) {
                functionB = seq[k];                
                mapCoocItemEquals.put(functionA, functionB, true);
            }
        }
    }
    return coocMap;   
}


/**
 * Method that checks if the pattern given as parameter can be skipped by means
 * of prune methods backward subpattern or backward superpattern. The method
 * uses a map where the different patterns are kept in order to check both
 * pruning methods. The hash keys used can vary.
 */
function checkAvoidance(pattern) {

    associatedMap = patternsHashTable.get(hashKey(pattern));

    /*
    * If there is not any pattern with the same hashKey value, we add the current
    * pattern as a new entry into patternsHashMap
    */
    if (associatedMap == null) {
        matchingMap.add(hashKey(pattern), pattern);
    } else {
        /*
        * If, conversely, there are some patterns with the same hashKey value,
        * we check if we can apply backward subpattern or backward superpattern pruning
        */
        isSuperPattern = false;
        for (pattern2 in associatedMap) {

            if (pattern.getSupport() == pattern2.getSupport()) {
                
                if (pattern2.size() != pattern.size()) {
                    if (pattern.isSubpattern(pattern2)) {
                        return true;
                    } else if (pattern2.isSubpattern(pattern)) {
                        isSuperPattern = true;
                        associatedMap.remove(pattern2);
                    }
                }
            }
        }
        associatedMap.add(pattern);
        return isSuperPattern;
    }

    return false;
}

/**
 * This function updates a function's info in the detected functions list. 
 * this information include the confidence, supprt, and the changeSet functions that impacted on that function.
 */
function updateDetectedEntitiesInfo(newConfidence, newSupport, functionID, changeSet) {
    info = detectedFunctions.get(functionID);

    if (newConfidence > info.confidence) {

        // replace the current data with the new information 
        info.confidence = newConfidence;
        info.support = newSupport;
        antecedents.clear();
        info.antecedents.add(changeSet);

    } else if (newConfidence!=0.0 && newConfidence == info.confidence) {
        // add the new changeSet items to that function's antecedents
        info.antecedents.add(changeSet);
    }

}
/**
 * This function eliminates the impactedFunctions with confidence less than the given minumumConfidence.
 */
function pruneImpactSet(){
    for(impactedFunction in detectedFunctions){
        if(impactedFunction.getConfidence() < minimumConfidence){
            detectedFunctions.remove(impactedFunction);
        }
    }
}