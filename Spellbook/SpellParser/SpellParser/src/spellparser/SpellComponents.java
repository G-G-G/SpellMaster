package spellparser;

public class SpellComponents {
    public boolean V = false;
    public boolean S = false;
    public boolean M = false;
    public String MDetails = "";
    
    public SpellComponents(String rawComponents) {
        String[] components = rawComponents.split(",");
        for(int i = 0; i < components.length; i++){
            String component = components[i].trim();
            if(component.toUpperCase().equals("V")){
                V = true;
            } else if(component.toUpperCase().equals("S")){
                S = true;
            } else if(component.toUpperCase().startsWith("M")){
                M = true;
            }
        }
        
        int mDetailsIndex = rawComponents.indexOf("(");
        if(mDetailsIndex > -1) {
            MDetails = rawComponents.substring(mDetailsIndex).replace("(","").replace(")","").trim();
        }
    }
    
    public String PrintJS() {
        String tab = "    ";
        String quote = "\"";
        String comma = ",";
        String newLine = "\n";
        
        String str = "{" + newLine;
        str = str + tab + tab + tab + "V: " + V + comma + newLine;
        str = str + tab + tab + tab + "S: " + S + comma + newLine;
        str = str + tab + tab + tab + "M: " + M + comma + newLine;
        str = str + tab + tab + tab + "MDetails: " + quote + MDetails + quote + newLine;
        str = str + tab + tab + "}";
        
        return str;
    }
}
