package at.tugraz.kmi.medokyservice.fca;

import java.util.Collection;
import java.util.HashSet;

import at.tugraz.kmi.medokyservice.fca.bl.Magic;
import at.tugraz.kmi.medokyservice.fca.bl.Updater;
import at.tugraz.kmi.medokyservice.fca.db.Database;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.Concept;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.Course;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.Domain;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.FCAItemMetadata;
import at.tugraz.kmi.medokyservice.fca.db.domainmodel.LearningObject;
import at.tugraz.kmi.medokyservice.fca.db.usermodel.LearnerConcept;
import at.tugraz.kmi.medokyservice.fca.db.usermodel.LearnerDomain;
import at.tugraz.kmi.medokyservice.fca.db.usermodel.LearnerLattice;
import at.tugraz.kmi.medokyservice.fca.db.usermodel.User;
import at.tugraz.kmi.medokyservice.fca.rest.FCAService;

public abstract class FCAInterface {

  public static Collection<LearningObject> getLOsFromInquiry(long inquiryId) {
    synchronized (Database.getInstance()) {
      Course c = Database.getInstance().get(inquiryId);
      HashSet<LearningObject> result = new HashSet<LearningObject>();
      for (Domain d : c.getDomains()) {
        d.setMetadata();
        Collection<FCAItemMetadata> metadata = d.getMapping().getItemMetadata().values();
        for (FCAItemMetadata data : metadata) {
          result.addAll(data.getLearningObjects());
        }
      }
      return result;
    }
  }

  public static Long getLearnerID(String learnerId){
   User u = Database.getInstance().getUserByExternalUID(learnerId);
   if(u==null){
     u = new User(learnerId, "Anonymous", "generated at backend");
     //log("New User " + u.getId() + ", " + u.getExternalUid() + ", " + u.getName() + ", " + u.getDescription());
     Database.getInstance().put(u, true);
   }
    return Database.getInstance().getUserByExternalUID(learnerId).getId();
  }
  
  public static Long getInquiryID(String learnerId) throws FCAException{
    Course c= Database.getInstance().getCourseByExternalID(learnerId);
    if(c==null)
      throw new FCAException("Inquiry does not Exists");
    return c.getId();
  }
  
  public static Collection<LearnerLattice> getLearnerModel(long inquiryId, long learnerId) throws FCAException {
    Course c = Database.getInstance().get(inquiryId);
    Magic.createLearnerModel(learnerId, inquiryId);
    HashSet<LearnerLattice> result = new HashSet<LearnerLattice>();
    for (Domain d : c.getDomains()) {
      if (d.containsLearnerDomain(learnerId)) {
        LearnerDomain domain = d.getLearnerDomain(learnerId);
        domain.setMetadata();
        result.add(domain.getFormalContext());
      }
    }
    return result;
  }

  public static Collection<Concept> getNextLearningConcepts(long inquiryId, long learnerId) {
    Course c = Database.getInstance().get(inquiryId);
    HashSet<Long> resultIds = new HashSet<Long>();
    for (Domain d : c.getDomains()) {
      if (d.containsLearnerDomain(learnerId)) {
        LearnerLattice lattice = d.getLearnerDomain(learnerId).getFormalContext();
        for (LearnerConcept concept : lattice.getConcepts()) {
          if (concept.getPercentagedValuations()[0] != 0f || concept.getPercentagedValuations()[0] != 0f) {
            resultIds.add(concept.getDomainConceptId());
          }
        }
      }
    }
    return Database.getInstance().get(resultIds);
  }

  public static void setVisitedLO(long inquiryId, long learnerId, long learningObjectId) throws Exception {
    Course c = Database.getInstance().get(inquiryId);
    for (Domain d : c.getDomains()) {
      if (d.containsLearnerDomain(learnerId)) {
        Updater.update(d.getLearnerDomain(learnerId), learningObjectId);
        return;
      }
    }
  }

  public static void setCompletedActivity(long inquiryId, long learnerId, Object activity) {
	  //TODO: implement functionality;
  }
}
