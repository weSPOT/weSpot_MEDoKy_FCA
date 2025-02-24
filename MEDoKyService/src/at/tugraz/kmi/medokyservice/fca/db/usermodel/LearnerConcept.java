/*
 * 
 * MEDoKyService:
 * A web service component for learner modelling and learning recommendations.
 * Copyright (C) 2015 KTI, TUGraz, Contact: simone.kopeinik@tugraz.at
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
 * See the GNU Affero General Public License for more details.  
 * For more information about the GNU Affero General Public License see <http://www.gnu.org/licenses/>.
 * 
 */
package at.tugraz.kmi.medokyservice.fca.db.usermodel;

import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

import org.codehaus.jackson.annotate.JsonIgnore;

import at.tugraz.kmi.medokyservice.fca.db.DataObject;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.Concept;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.FCAAttribute;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.FCAObject;

/**
 * A LearnerConcept linked to a {@link Concept} of the domain model.
 * 
 * @author Bernd Prünster <mail@berndpruenster.org>
 * 
 */
public class LearnerConcept extends DataObject {

  private static final long            serialVersionUID = -1379190857847955644L;
  private long                         domainConceptId;

  @JsonIgnore
  private Set<LearnerConcept>          predecessors;
  private Set<LearnerConcept>          successors;
  private Set<LearnerConcept>          taxonomySuccessors;
  private HashMap<FCAObject, Float>    objects;
  private HashMap<FCAAttribute, Float> attributes;
  private boolean                      viewed;

  /**
   * Creates a new LearnerConcept based upon a {@link Concept} of the domain
   * model
   * 
   * @param c
   *          the {@link Concept} this LearnerConcept is based upon
   * @param user
   *          the user this concept belongs to
   */
  @SuppressWarnings("rawtypes")
  public LearnerConcept(Concept c) {
    super(c.getName(), c.getDescription());
    viewed = false;
    domainConceptId = c.getId();
    objects = new HashMap<FCAObject, Float>();
    attributes = new HashMap<FCAAttribute, Float>();

    for (Comparable o : c.getObjects()) {
      objects.put((FCAObject) o, 0f);
    }

    for (Comparable a : c.getAttributes()) {
      attributes.put((FCAAttribute) a, 0f);
    }

    predecessors = new LinkedHashSet<LearnerConcept>();
    successors = new LinkedHashSet<LearnerConcept>();
    taxonomySuccessors = new LinkedHashSet<LearnerConcept>();
    c.addLearnerConcept(this);
  }

  /**
   * Creates a bidirectional relation between the {@literal predecessor} and the
   * {@literal successor}
   * 
   * @param predecessor
   *          the predecessor
   * @param successor
   *          the successor
   */
  public static void relate(LearnerConcept predecessor, LearnerConcept successor) {
    predecessor.addSuccessor(successor);
    successor.addPredecessor(predecessor);
  }

  private void addPredecessor(LearnerConcept predecessor) {
    predecessors.add(predecessor);

  }

  private void addSuccessor(LearnerConcept successor) {
    successors.add(successor);

  }

  /**
   * advanced getter
   * 
   * @return the objects of this concept with valuations mapped to them
   */
  public Map<FCAObject, Float> getObjects() {
    return objects;
  }

  /**
   * advanced getter
   * 
   * @return the attributes of this concept with valuations mapped to them
   */
  public Map<FCAAttribute, Float> getAttributes() {
    return attributes;
  }

  /**
   * computes the percentage valuation of the object- and attribute-set of this
   * concept
   * 
   * @return a float array containing two values ranging from -1 to +1 (-100% to
   *         +100%) the first values corresponds to the valuation of objects,
   *         while the second one represents the attribute valuation
   */
  public float[] getPercentagedValuations() {
    Map<FCAObject, Float> objects = getObjects();
    Map<FCAAttribute, Float> attributes = getAttributes();
    float attr = 0f, obj = 0f;
    for (float f : objects.values())
      obj += f;
    for (float f : attributes.values())
      attr += f;
    obj = objects.isEmpty() ? obj : obj / (float) objects.size();
    attr = attributes.isEmpty() ? attr : attr / (float) attributes.size();
    float[] result = { obj, attr };
    return result;
  }

  public Set<LearnerConcept> getPredecessors() {
    return predecessors;
  }

  public Set<LearnerConcept> getSuccessors() {
    return successors;
  }

  public Set<LearnerConcept> getTaxonomySuccessors() {
    return taxonomySuccessors;
  }

  public long getDomainConceptId() {
    return domainConceptId;
  }

  /**
   * Disallow making changes to the sets of successors and predecessors. This
   * operation is irreversible.
   * 
   */
  public void disallowChanges() {
    successors = Collections.unmodifiableSet(successors);
    predecessors = Collections.unmodifiableSet(predecessors);
  }

  public String toString() {
    return Long.toString(getId());
  }

  public boolean isViewed() {
    return viewed;
  }

  public void setViewed(boolean viewed) {
    this.viewed = viewed;
  }

}
