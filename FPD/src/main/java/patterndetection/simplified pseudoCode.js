
function main() {
    MIN_CONF = 0.5;
    ENOUGH_CONF = 0.5;
    changeSet = [...];
    sequenceSet = loadCommits();
    coocMap = computeCooc()
    extensions = sequenceSet.getAllFunction();

    runAlgorithm(extensions);
    pruneImpactSet();

}

function runAlgorithm(extensions) {

    for (e in extensions) {

        if (detectionInfo.get(e).confidence >= ENOUGH_CONF) {
            continue;
        }
        p = { e };

        recExtend(p, extensions[e: end]);
    }
}

function recExtend(p, extensions) {

    if (checkAvoidance(p, extensions)) {
        return;
    }

    newPatterns = [];
    newExtensions = [];

    for (e in extensions) {

        if (!coocMap[p.lastEntity].includes(e) ||
            detectionInfo.get(e).confidence >= ENOUGH_CONF) {
            continue;
        }

        q = p + e

        if (q.confidence >= MIN_CONF) {
            if (changeSet.contains(e)) {
                for (entity in p.undetectedEntities) {
                    updateDetectedEntitiesInfo(q, entity);
                }
            } else {
                updateDetectedEntitiesInfo(q, e);
            }
        }

        if(checkPatternValublity(q, e, extensions))
            newPatterns.add(q)
        
        if(checkExtensionValublity(q, e, extensions))
            newExtensions.add(e)


        if (e >= extensions.undetectedEntities[last] &&
            q.confidence >= ENOUGH_CONF) {
            break;
        }
    }


    for (pattern in newPatterns) {
        recExtend(pattern, newExtensions[pattern.lastEntity: end]);
    }
}

function computeCooc(transactionList) {
    coocMap = map();
    for (transaction in transactionList) {
        for (i = 0; i < transaction.size(); i++) {
            entityA = transaction[i]
            for (j = i + 1; j < transaction.size(); j++) {
                entityB = transaction[k]
                coocMap[entityA].add(entityB);
            }
        }
    }
    return coocMap;
}

function checkAvoidance(p, extensions) {

    if (p.undetectedEntities.isEmpty() &&
        extensions.undetectedEntities.isEmpty()) {
        break;
    }
    if (p.changeSetEntities.isEmpty() &&
        p.lastEntity >= extensions.changeSetEntities[last]) {
        break;
    }

    isSuperPattern = false;
    for (oldPattern in allPatterns) {
        if (p.support == oldPattern.support) {

            if (p.size() != oldPattern.size() ) {
                if (p.isSubpattern(oldPattern)) {
                    return true;
                } else if (oldPattern.isSubpattern(p)) {
                    isSuperPattern = true;
                    allPatterns.remove(oldPattern);
                }
            }
        }
    }
    allPatterns.add(p);
    return isSuperPattern;
}

function checkPatternValublity(q, e, extensions){
    if (changeSet.contains(e)) {
        if (e < extensions.changeSetEntities[last] ||
            q.confidence >= MIN_CONF) {
                return true
            }
    } else {
        if (e < extensions.changeSetEntities[last] &&
            q.confidence < MIN_CONF) {
            return true
        }
    }
    return false
}

function checkExtensionValublity(q, e, extensions) {
    if (changeSet.contains(e) ||
        (extensions.changeSetEntities && 
            q.confidence < ENOUGH_CONF)) {
        return true
    }
    return false
}

function updateDetectedEntitiesInfo(q, e) {

    info = detectionInfo.get(e);

    if (q.confidence > info.confidence) {

        info.confidence = q.confidence;
        info.support = q.support;
        info.antecedents.clear();
        info.antecedents.add(q.changeSetEntities);

    } else if (newConfidence != 0.0 &&
        q.confidence == info.confidence) {
        info.antecedents.add(q.changeSetEntities);
    }

}

function pruneImpactSet() {
    for (impactedFunction in detectionInfo) {
        if (impactedFunction.confidence < MIN_CONF) {
            detectionInfo.remove(impactedFunction);
        }
    }
}