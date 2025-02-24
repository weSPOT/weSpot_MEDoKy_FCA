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
package at.tugraz.kmi.medokyservice.fca.bl;

import java.util.HashSet;
import java.util.Set;

import at.tugraz.kmi.medokyservice.fca.db.Database;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.FCAAttribute;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.FCAObject;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.LearningObject;
import at.tugraz.kmi.medokyservice.fca.db.usermodel.LearnerConcept;
import at.tugraz.kmi.medokyservice.fca.db.usermodel.LearnerDomain;
import at.tugraz.kmi.medokyservice.fca.db.usermodel.LearnerLattice;

/**
 * Updater class receiving indicators/updates as a consequence of a user action
 * computing valuations of concepts.
 * 
 * @author Bernd Prünster <mail@berndpruenster.org>
 * 
 */
public abstract class Updater {

  /**
   * 
   * @param domain
   *          the affected domain
   * @param source
   *          the id of the learning object responsible for the update
   * @return an updates version of the affected domain's lattice
   * @throws Exception
   *           when saving the database failed
   */
  public static synchronized void update(LearnerDomain domain, long source) throws Exception {
    Database db = Database.getInstance();
    synchronized (db) {
      domain.setMetadata();
      LearningObject clickedObject = Database.getInstance().get(source);
      LearnerLattice lattice = domain.getFormalContext();
      lattice.addClickedLearningObject(clickedObject);
      Set<LearningObject> clickedLearningObjects = lattice.getClickedLearningObjects();

      for (LearnerConcept c : domain.getFormalContext().getConcepts()) {
        FCAAttribute[] domainAttrs = c.getAttributes().keySet().toArray(new FCAAttribute[c.getAttributes().size()]);
        for (FCAAttribute a : domainAttrs) {
          if (a.containsLearningObject(clickedObject)) {
            Set<LearningObject> intersection = new HashSet<LearningObject>(clickedLearningObjects);
            Set<LearningObject> combinedLearningObjects = new HashSet<LearningObject>(a.getLearningObjects());
            combinedLearningObjects.addAll(a.getLearningObjectsByLearners());
            intersection.retainAll(combinedLearningObjects);
            float valuation = ((float) (intersection.size())) / ((float) (combinedLearningObjects.size()));
            c.getAttributes().put(a, valuation);
          }
        }
        FCAObject[] domainObjs = c.getObjects().keySet().toArray(new FCAObject[c.getObjects().size()]);
        for (FCAObject o : domainObjs) {
          if (o.containsLearningObject(clickedObject)) {
            Set<LearningObject> intersection = new HashSet<LearningObject>(clickedLearningObjects);
            Set<LearningObject> combinedLearningObjects = new HashSet<LearningObject>(o.getLearningObjects());
            combinedLearningObjects.addAll(o.getLearningObjectsByLearners());
            intersection.retainAll(combinedLearningObjects);
            float valuation = ((float) (intersection.size())) / ((float) (combinedLearningObjects.size()));
            c.getObjects().put(o, valuation);
          }
        }
      }
      db.save();
    }
  }

  public static synchronized void update(LearnerDomain domain) throws Exception {
    Database db = Database.getInstance();

    synchronized (db) {
      domain.setMetadata();
      LearnerLattice lattice = domain.getFormalContext();
      Set<LearningObject> clickedLearningObjects = lattice.getClickedLearningObjects();
      for (LearnerConcept c : domain.getFormalContext().getConcepts()) {
        FCAAttribute[] domainAttrs = c.getAttributes().keySet().toArray(new FCAAttribute[c.getAttributes().size()]);
        for (FCAAttribute a : domainAttrs) {
          Set<LearningObject> intersection = new HashSet<LearningObject>(clickedLearningObjects);
          Set<LearningObject> combinedLearningObjects = new HashSet<LearningObject>(a.getLearningObjects());
          combinedLearningObjects.addAll(a.getLearningObjectsByLearners());
          intersection.retainAll(combinedLearningObjects);
          float valuation = combinedLearningObjects.isEmpty() ? 1f : ((float) (intersection.size()))
              / ((float) (combinedLearningObjects.size()));
          c.getAttributes().put(a, valuation);
        }
        FCAObject[] domainObjs = c.getObjects().keySet().toArray(new FCAObject[c.getObjects().size()]);
        for (FCAObject o : domainObjs) {
          Set<LearningObject> intersection = new HashSet<LearningObject>(clickedLearningObjects);
          Set<LearningObject> combinedLearningObjects = new HashSet<LearningObject>(o.getLearningObjects());
          combinedLearningObjects.addAll(o.getLearningObjectsByLearners());
          intersection.retainAll(combinedLearningObjects);
          float valuation = combinedLearningObjects.isEmpty() ? 1f : ((float) (intersection.size()))
              / ((float) (combinedLearningObjects.size()));
          c.getObjects().put(o, valuation);
        }
      }
      db.save();
    }
  }
}
