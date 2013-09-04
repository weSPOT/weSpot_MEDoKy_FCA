package at.tugraz.kmi.medokyservice.fca.db;

import java.io.IOException;
import java.io.Serializable;
import java.io.StringWriter;

import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;

import at.tugraz.kmi.medokyservice.fca.JSONMapper;

/**
 * Root Class of all FCA related classes providing a {@link Long} id to store it
 * inside the {@link Database} and a {@link String} name and description.
 * 
 * @author Bernd Prünster <bernd.pruenster@gmail.com>
 * 
 */
public abstract class DataObject implements Comparable<DataObject>,
    Serializable {

  private static final long serialVersionUID = 4030398877692134854L;
  /**
   * unique identifier of a {@link DataObject}
   * 
   */
  protected long id;
  private String name;
  private String description;

  /**
   * Creates a new {@link DataObject} with a unique {@literal id}
   * 
   * @param name
   *          the objects name
   * @param description
   *          the objects description
   */
  public DataObject(String name, String description) {
    this.id = IDGenerator.getInstance().getID();
    this.name = name;
    this.description = description;

  }

  public long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  /**
   * Compares this {@link DataObject} with the specified {@link DataObject} for
   * order. Returns a negative integer, zero, or a positive integer as this
   * {@link DataObject}s id is less than, equal to, or greater than the
   * specified {@link DataObject}s id.
   * 
   * @see java.lang.Comparable#compareTo(Object)
   * 
   * @return a negative integer, zero, or a positive integer as this
   *         {@link DataObject}s id is less than, equal to, or greater than the
   *         specified {@link DataObject}s id.
   */
  @Override
  public int compareTo(DataObject o) {
    return (id < o.id) ? -1 : ((id == o.id) ? 0 : 1);
  }

  /**
   * Indicates whether some other object is "equal to" this one. If the other
   * object extends {@link DataObject} the ids are checked for eqaulity.
   * 
   * @see Object#equals(Object)
   * 
   * @param o
   *          the reference object with which to compare.
   * @throws NullPointerException
   *           when trying to compare this object to null.
   * @return {@literal true} if this object is the same as the {@literal obj}
   *         argument; {@literal false} otherwise.
   * 
   */
  @Override
  public boolean equals(Object o) {
    if (o == null)
      throw new NullPointerException(
          "Error trying to compare a DataObject to null!");
    if (o instanceof DataObject)
      return id == ((DataObject) (o)).id;
    return o.equals(this);
  }

  /**
   * Returns a JSON string representation of the object using the
   * {@link JSONMapper}
   * 
   * @return a JSON string representation of the object
   */
  @Override
  public String toString() {
    StringWriter writer = new StringWriter();
    try {
      JSONMapper.getInstance().writeValue(writer, this);
      String str = writer.toString();
      return str;
    } catch (JsonGenerationException e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    } catch (JsonMappingException e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    } catch (IOException e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    }
    return "id: " + id + ", name: " + name + ", description: " + description;
  }

}
