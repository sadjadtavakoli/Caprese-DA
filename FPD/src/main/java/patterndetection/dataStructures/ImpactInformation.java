package patterndetection.dataStructures;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import patterndetection.tries.TrieNode;

/**
 * Implementation of an ImpactedItem. This implementation is generic in order to
 * be able
 * to manage any kind of item (string, integer, ...)
 * 
 */
public class ImpactInformation {

    private static ImpactInformation nullInstance;
    private Double confidence;
    private Integer support;
    private List<List<TrieNode>> antecedents;

    public static ImpactInformation nullObject() {
        if (nullInstance == null) {
            nullInstance = new ImpactInformation(0.0, 0, Arrays.asList());
        }
        return nullInstance;
    }

    public ImpactInformation(Double confidence, Integer support, List<TrieNode> changeSet) {
        this.confidence = confidence;
        this.support = support;
        this.antecedents = new ArrayList<>();
        this.antecedents.add(changeSet);
    }

    public void updateImpact(Double newConfidence, Integer newSupport, List<TrieNode> changeSet) {
        if (newConfidence > this.confidence) {
            this.confidence = newConfidence;
            this.support = newSupport;
            antecedents.clear();
            this.antecedents.add(changeSet);
        } else if (newConfidence != 0.0 && newConfidence.equals(this.confidence)) {
            this.antecedents.add(changeSet);
            if (newSupport > this.support)
                this.support = newSupport;
        }
    }

    public Double getConfidence() {
        return this.confidence;
    }

    public Integer getSupport() {
        return this.support;
    }

    public List<List<TrieNode>> getAntecedents() {
        return this.antecedents;
    }

    @Override
    public String toString() {
        StringBuilder r = new StringBuilder(200);
        r.append("{");
        r.append("\"confidence\":");
        r.append(this.confidence);
        r.append(", \"support\":");
        r.append(this.support);
        r.append(", \"FPD-antecedents\":");
        r.append(this.antecedents);
        r.append("}");
        return r.toString();
    }
}