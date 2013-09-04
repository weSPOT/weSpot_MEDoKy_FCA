package at.tugraz.kmi.medokyservice.fca.db.usermodel;

import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Set;

import at.tugraz.kmi.medokyservice.fca.db.DataObject;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.Concept;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.Lattice;

/**
 * This class represents a personalised overlay of a {@link Lattice}. Similar to
 * a lattice its structure is defined through bidirectional relations of
 * {@link LearnerConcept}s.
 * 
 * @author Bernd Prünster <bernd.pruenster@gmail.com>
 * 
 */
public class LearnerLattice extends DataObject {

  /**
   * 
   */
  private static final long serialVersionUID = 4677352490936383590L;

  private Set<LearnerConcept> concepts;

  private LearnerConcept bottom, top;

  /**
   * Creates a LearnerLattice based upon a {@link Lattice} from the domain
   * model.
   * 
   * @param lattice
   */
  public LearnerLattice(Lattice lattice) {
    super("UserLattice for " + lattice.getName(), lattice.getDescription());

    concepts = new LinkedHashSet<LearnerConcept>();
    bottom = new LearnerConcept(lattice.getBottom());
    concepts.add(bottom);
    top = new LearnerConcept(lattice.getTop());
    concepts.add(top);
    HashMap<Concept, LearnerConcept> registry = new HashMap<Concept, LearnerConcept>();
    registry.put(lattice.getBottom(), bottom);
    registry.put(lattice.getTop(), top);
    for (Concept c : lattice.getConcepts()) {
      LearnerConcept concept;
      if (!registry.containsKey(c)) {
        concept = new LearnerConcept(c);
        concepts.add(concept);
        registry.put(c, concept);
      } else
        concept = registry.get(c);
      for (Concept s : c.getSuccessors()) {
        LearnerConcept suc;
        if (!registry.containsKey(s)) {
          suc = new LearnerConcept(s);
          concepts.add(concept);
          registry.put(s, concept);
        } else
          suc = registry.get(s);
        LearnerConcept.relate(concept, suc);
        concept.disallowChanges();
      }
    }
    // order!
    concepts.remove(top);
    concepts.add(top);
    concepts = Collections.unmodifiableSet(concepts);
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