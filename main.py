import pandas as pd
import re

# A – classmark
# B – title (90% of cases = 'Bible' — to discuss!)
# C – material
# D – height
# E – width
# F – number of leaves
# G – number of columns
# H – number of lines
# I – condition (to discuss!)
# J – language
# K – content (= second line + fifth line + if possible, masoretic notes– to discuss!)
# L – bibliography (to discuss!)
# M – associated fragments (to discuss!) 
def main():
    file = open("DavisCatalogue.txt")
    bibFile = open("DavisBibliography.txt")
    catalogue = file.read()
    bib = bibFile.read()
    entries = catalogue.split("#")
    entries[:] = [x for x in entries if x]
    bibEntries = bib.split("\n\n\n")
    bibEntries[:] = [x for x in bibEntries if x]
    file.close()
    bibFile.close()
    bibDict = {}
    problems = []
    for bibEntry in bibEntries:
        bibEntry = bibEntry.replace("\n", "; ")
        label = re.findall(r"(?<=Label: \S)([^\n]*)", bibEntry)
        label = label[0]
        bibDict[label] = bibEntry

    rows = []
    for entry in entries:
        
        dict = {}
        entry = (
            entry
                # .replace(". Pa", ".\nPa")
                # .replace(". pa", "\npa")
                # .replace("; Pa", "\nPa")
                # .replace("; pa", "\npa")
                .replace("mutilated", "damaged")
                .replace(";\n", "; ")
                .replace("\n;", ";")
                
        )
        paPattern = r"([.;])\s(Parchment|Paper)"
        entry = re.sub(paPattern, r"\1\n\2",entry, flags=re.IGNORECASE)
        entry = re.sub(r"(?<=;)\n(?=\d)", " ", entry)
        pattern = r"(The tetragrammaton is abbreviated)[^.]*"
        entry = re.sub(pattern, r"\1", entry, flags=re.IGNORECASE)
        pattern2 = r"(damaged.*?\.) "
        entry = re.sub(pattern2, r"\1\n", entry, flags=re.IGNORECASE)


        
        
        lines = entry.split("\n")
        lines[:] = [x for x in lines if x]


        if len(lines)==0:
            continue


        dict['A'] = lines[0]

        dict['L'] = bibDict[lines[0]] if lines[0] in bibDict else ''
        

        if re.findall(r"\[\d+\]", lines[-1]):
            lines.remove(lines[-1])

        if "tetragrammaton is abbreviated" in entry or "iturgical poetry" in entry:
            dict.update({'B': "Bible-Related"})
            
        else:
            dict.update({'B': "Bible"})

        if len(lines) < 3:
            dict['K'] = lines[1] if len(lines)>1 else ''
            if "See" in entry and "Klein" not in entry:
                problems.append(",".join(lines))
            elif "Klein" in entry and len(lines[1])<20:
                continue
            else:
                rows.append(dict)
            continue

        if "archment" in lines[2] or "aper" in lines[2]:
            lines.insert(2, "")
        
        if len(lines)>5:
            last = " ".join(lines[4:])
            lines[4] = last
        K = lines[1] + '; ' + lines[4] if len(lines)>=5 else lines[1]

        nonPattern = r"(vocalization).+?(?=become|occur|\.\s[A-Z]|\.\s\[|\[|$)"
        K = re.sub(nonPattern, r"\1", K)
        K = re.sub(r"vocalization$", "vocalization.", K)
        # K = re.sub(r"vocalization\s*\[[A-zÀ-ú]", "vocalization are [", K)


        titlePattern = r"(T-S\s*\w*\s*\d+\.\d+|Or\.\s*\d+(?:\.\d+)*|Wm.\s*\S*\s*\d+(?:\.\d+)*)"
        refs = re.findall(titlePattern, K)
        refString = "; ".join(refs)

        dict.update({'M': refString, 'K': K, 'J': lines[2]})
        if len(lines) >= 4:
            vals = lines[3].split(";")
            if len(vals)==1:
                dict['K'] = K + vals[0]
                rows.append(dict)
                continue
            if len(vals) <5 and len(lines)>4 and ";" in lines[4]:
                vals2 = lines[4].split(";")
                vals = vals + vals2
                lines[3] =  lines[3]+lines[4]
                lines.remove(lines[4])
            if len(vals)<3 or "col" not in vals[2]:
                vals.insert(2, "")
            if  len(vals)<4 or "lea" not in vals[3] :
                vals.insert(3, "")
            if  len(vals)<5 or "line" not in vals[4] :
                vals.insert(4, "")
            if len(vals) < 6:
                vals.append("")
            dict.update({'C': vals[0], 'F': vals[3], 
                        'G': vals[2],'H': vals[4], 'I': vals[5]})
            if "average" in vals[1]:
                vals[1] = re.sub(r"([^,]*)\sx\s([^,]*)\s=\s([^,]*)", r"\1 = \3 x \2 = \3", vals[1])
            dims = re.split(r"x|and|,", vals[1])
            if len(dims)==2:
                dict.update({'D': dims[0].strip(),'E':  dims[1].strip()})
            else:
                h = dims[::2]
                w = dims[1::2]
                delim = "; "
                height = delim.join(h)
                width = delim.join(w)
                dict.update({'D': height,'E': width})
        rows.append(dict)
    df = pd.DataFrame(rows, 
        columns=['A','B','C','D','E','F','G','H','I','J','K','L','M'])
    df.to_csv("test.csv", index=False)

    # print(len(problems), problems)

if __name__ == '__main__':
    main()
