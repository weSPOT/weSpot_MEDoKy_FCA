package at.tugraz.kmi.medokyservice.fca.db.usermodel;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

import at.tugraz.kmi.medokyservice.fca.db.DataObject;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.Concept;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.FCAAttribute;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.FCAObject;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.Lattice;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.LearningObject;

/**
 * This class represents a personalised overlay of a {@link Lattice}. Similar to
 * a lattice its structure is defined through bidirectional relations of
 * {@link LearnerConcept}s.
 * 
 * @author Bernd Prünster <mail@berndpruenster.org>
 * 
 */
public class LearnerLattice extends DataObject {
  /**
   * 
   */
  private static final long serialVersionUID = 4677352490936383590L;
  private Set<LearnerConcept> concepts;
  private LearnerConcept bottom, top;
  private Map<FCAObject, Float> objects;
  private Map<FCAAttribute, Float> attributes;
  private Set<LearningObject> clickedLearningObjects;
  
  
  
  //TODO: init list of objects and attributes 
  
  
  /**
   * Creates a LearnerLattice based upon a {@link Lattice} from the domain
   * model.
   * 
   * @param lattice
   *          the base for this LearnerLattice
   * @param user
   *          the user it belongs to
   */
  public LearnerLattice(Lattice lattice) {
    super("Learner" + lattice.getName(), lattice.getDescription());
    this.attributes = new HashMap<FCAAttribute, Float>(); 
    this.objects = new HashMap<FCAObject, Float>();

    clickedLearningObjects = new HashSet<LearningObject>();
    concepts = Collections.synchronizedSet(new LinkedHashSet<LearnerConcept>());
    synchronized (concepts) {
      HashMap<Long, LearnerConcept> registry = new HashMap<Long, LearnerConcept>();
      bottom = new LearnerConcept(lattice.getBottom());
      concepts.add(bottom);
      if (lattice.getTop() != null) {
        top = new LearnerConcept(lattice.getTop());
        concepts.add(top);
      }
      registry.put(lattice.getBottom().getId(), bottom);
      if (top != null)
        registry.put(lattice.getTop().getId(), top);
      for (Concept c : lattice.getConcepts()) {
        LearnerConcept concept;
        if (!registry.containsKey(c.getId())) {
          concept = new LearnerConcept(c);
          concepts.add(concept);
          registry.put(c.getId(), concept);
        } else {
          concept = registry.get(c.getId());
        }
        for (Concept s : c.getSuccessors()) {
          LearnerConcept suc;
          if (!registry.containsKey(s.getId())) {
            suc = new LearnerConcept(s);
            concepts.add(suc);
            registry.put(s.getId(), suc);
          } else {
            suc = registry.get(s.getId());
          }
          LearnerConcept.relate(concept, suc);
        }
      }
      // order!
      if (top != null) {
        concepts.remove(top);
        concepts.add(top);
      }
      for (LearnerConcept concept : concepts)
        concept.disallowChanges();
      concepts = Collections.unmodifiableSet(concepts);
    }
  }

  
  private void initObjectAndAttributeSets(){
	  for (LearnerConcept concept : concepts){
		  this.attributes.putAll(concept.getAttributes());
		  this.objects.putAll(concept.getObjects());
	  } 
  }
  
  public Map<FCAAttribute, Float> getAttributes(){
	  if (this.attributes.size()>0)
		  return this.attributes;
	  this.initObjectAndAttributeSets();
	  return this.attributes;
  }
  
  public Map<FCAObject, Float> getObjects(){
	  if (this.objects.size()>0)
		  return this.objects;
	  this.initObjectAndAttributeSets();
	  return this.objects;
  }
  
  public Set<LearnerConcept> getConcepts() {
    return concepts;
  }

  public LearnerConcept getTop() {
    return top;
  }

  public LearnerConcept getBottom() {
    return bottom;
  }

  public void addClickedLearningObject(LearningObject obj) {
    clickedLearningObjects.add(obj);
  }

  public Set<LearningObject> getClickedLearningObjects() {
    return clickedLearningObjects;
  }
  
  /**
   * Return a String representation of this object. The string value returned is
   * subject to change and therefore only suitable for debugging purposes.
   * 
   * @return a String representation of this object
   */
  public String toString() {
    StringBuffer buf = new StringBuffer(getName());
    for (LearnerConcept c : concepts) {
      buf.append("\n").append(c.toString());
      for (LearnerConcept u : c.getSuccessors())
        buf.append("\n\t\t").append(u.toString());
    }
    return buf.toString();
  }
}