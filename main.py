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
        if ". Parchment" in entry:
            entry = entry.replace(". Parchment", ".\nParchment")
        lines = entry.split("\n")
        lines[:] = [x for x in lines if x]
        print(lines)
        if len(lines) < 3:
            continue
        if "tetragrammaton" in entry:
            dict.update({'B': "Bible-Related"})
            pattern = rf"({re.escape("The tetragrammaton is abbreviated")})[^.]*"
            lines[4] = re.sub(pattern, r"\1", lines[4])
        else:
            dict.update({'B': "Bible"})
        if "mutilated" in entry:
            lines[3] = lines[3].replace("mutilated", "damaged")
        dict.update({'A': lines[0]})
        K = lines[1] + "; " + lines[4] if len(lines)==5 else lines[1]
        dict.update({'K': K, 'J': lines[2]})
        vals = lines[3].split(";")
        if "col" not in vals[2]:
            vals.insert(2, "")
        if "lea" not in vals[3]:
            vals.insert(3, "")
        if "line" not in vals[4]:
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
