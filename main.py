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
    catalogue = file.read()
    entries = catalogue.split("#")
    entries[:] = [x for x in entries if x]
    rows = []
    for entry in entries:
        dict = {}
       
        entry = (
            entry
                .replace(". Parchment", ".\nParchment")
                .replace("; Pa", "\nPa")
                .replace("; pa", "\npa")
                .replace("mutilated", "damaged")
                .replace(";\n", "; ")
                .replace("\n;", ";")
                
        )
        entry = re.sub(r"(?<=;)\n(?=\d)", " ", entry)
        pattern = rf"({re.escape("The tetragrammaton is abbreviated")})[^.]*"
        entry = re.sub(pattern, r"\1", entry)
        pattern2 = r"(damaged.*?\.) "
        entry = re.sub(pattern2, r"\1\n", entry)
        lines = entry.split("\n")
        lines[:] = [x for x in lines if x]
        if len(lines)==0:
            continue
        print(lines)
        if len(lines) < 3:
            dict['A'] = lines[0]
            dict['K'] = lines[1] if len(lines)>1 else ''
            rows.append(dict)
            continue

        if "archment" in lines[2] or "aper" in lines[2]:
            lines.insert(2, "")

        if "tetragrammaton" in entry:
            dict.update({'B': "Bible-Related"})
            
        else:
            dict.update({'B': "Bible"})
                
        dict.update({'A': lines[0]})
        K = lines[1] + "; " + lines[4] if len(lines)==5 else lines[1]
        dict.update({'K': K, 'J': lines[2]})
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
            dims = vals[1].split("x")
            if len(dims)==2:
                dict.update({'D': dims[0],'E':  dims[1]})
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
    df.to_csv("test.csv")

if __name__ == '__main__':
    main()
