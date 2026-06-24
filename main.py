import pandas as pd
import re
from spellchecker import SpellChecker

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
    spell = SpellChecker()
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
        bibEntry = bibEntry.replace("  ", " ")
        bibEntry = bibEntry.replace(" ;", ";")
        label = re.findall(r"(?<=Label: \S)([^\n]*)", bibEntry)
        label = label[0]
        bibDict[label] = bibEntry

    rows = []
   
    for entry in entries:
        
        dict = {}
        entry = (
            entry
                .replace("mutilated", "damaged")
                .replace("mutilation", "damage")
                .replace(";\n", "; ")
                .replace("\n;", ";")
                .replace(",", ";")
                .replace("  ", " ")
                .replace("Song of Solomon", "Song of Songs")
                .replace("Massorah", "Masora")
                .replace("- ", "-")
                .replace(" ;", ";")
                .replace("®", "")
                
        )
        entry = re.sub(r"(?<=\.)\s*י+\]", "", entry)
        paPattern = r"([.;])\s*(Parchment|Paper|leather)"
        entry = re.sub(paPattern, r"\1\n\2",entry, flags=re.IGNORECASE)
        entry = re.sub(r"(?<=;)\n(?=\d)", " ", entry)
        pattern = r"(The tetragrammaton is abbreviated)[^.]*"
        entry = re.sub(pattern, r"\1", entry, flags=re.IGNORECASE)
        entry = re.sub(r"(The tetragrammaton is abbreviated.)\s*[\u0590-\u05fe]*\]", r"\1", entry, flags=re.IGNORECASE)
        pattern2 = r"(damaged.*?\.) "
        entry = re.sub(pattern2, r"\1\n", entry, flags=re.IGNORECASE)
        entry = re.sub(r"(decorated)\s*[0\u25a0-\u25ff]", r"\1 ס", entry, flags=re.IGNORECASE)
        specialPattern = r"([A-Za-z])[־׳]"
        entry = re.sub(specialPattern, r"\1", entry)
        entry = re.sub(r"([A-Za-z0-9])([\u0590-\u05fe])", r"\1 \2", entry)
      
        realWords = ["non", "Judaeo", "Kittel", "prayer", "writ", "megillah", "pen", "branch", "Strauss", "right", "line", "one", "prev", "page", "title", 
                     "century","poll", "book", "al-Rida", "Dhual", "folio", "wa", "week", "ha-", "quarter", "drawn", "word", "half", "Tel", "end", "crossed", "pre", "al-", 
                     "Mosin", "wide", "he-", "ad-", "hand", "Judeao", "ink", "double", "space", "standard", "small", "side", "bibl"]
        entry = re.sub(r"([A-Za-z]{2,})-\s*([A-Za-z]{2,})", lambda match: match.group(1)+ "-" +match.group(2) if match.group(1)+ "-" +match.group(2) in spell or any(real.lower() in (match.group(1)+ "-" +match.group(2)).lower() for real in realWords) else match.group(1)+match.group(2), entry, flags=re.IGNORECASE)
        
        entry = re.sub(r"(?<=[^\u25a0-\u25ff])[\u25a0-\u25ff](?=[^\u25a0-\u25ff])", "", entry)


        
        lines = entry.split("\n")
        lines[:] = [x for x in lines if x]


        if len(lines)==0:
            continue


        dict['A'] = lines[0].strip().rstrip(';')

        dict['L'] = bibDict[lines[0]] if lines[0] in bibDict else ''
    

        if re.findall(r"\[\d+\]", lines[-1]):
            lines.remove(lines[-1])

        if "tetragrammaton is abbreviated" in entry or "iturgical poetry" in entry or "child's" in entry:
            dict.update({'B': "Bible-Related"})
            
        else:
            dict.update({'B': "Bible"})

        if len(lines) < 3:
            if "archment" and "aper" in entry:
                dict['C'] = "parchment; paper"
            elif "archment" in entry:
                dict['C'] = "parchment"
            elif "paper" in entry:
                dict['C'] = "paper"
            elif "leather" in entry:
                dict['C'] = "leather"
            dict['K'] = lines[1] if len(lines)>1 else ''
            if "See" in entry and "Klein" not in entry:
                problems.append(",".join(lines))
            elif "Klein" in entry and len(lines[1])<20:
                continue
            rows.append(dict)
            continue

        if "archment" in lines[2] or "aper" in lines[2]:
            lines.insert(2, "")
            
        
        if len(lines)>=4:
            if "archment" not in lines[3] and "aper" not in lines[3]:
                lines[2] = " ".join([lines[2], lines[3]])
                lines.remove(lines[3])
        
        if len(lines) >= 4:
            lines[3] = re.sub(r"(?<=\d)־", "-", lines[3])
            vals = lines[3].split(";")
            if len(vals)<=1:
                if "aper" or "archment" in lines[3]:
                    dict['C'] = lines[3].strip().rstrip(';')
                    dict['K'] = lines[1].strip().rstrip(';')
                    rows.append(dict)
                    continue
                dict['K'] = lines[1] + vals[3]
                rows.append(dict)
                continue
            if len(vals) <5 and len(lines)>4 and ";" in lines[4]:
                vals2 = lines[4].split(";")
                vals = vals + vals2
                lines[3] =  lines[3]+lines[4]
                lines.remove(lines[4])
            if len(lines)>5:
                last = " ".join(lines[4:])
                lines[4] = last
            G = []
            F = []
            H = []
            delim = "; "
            for val in vals:
                if "dama" in val:
                    continue
                elif "col" in val:
                    G.append(val.strip())
                elif "lea" in val:
                    F.append(val.strip())
                elif "line" in val:
                    H.append(val.strip())
            G = delim.join(G).strip().rstrip(';')
            F = delim.join(F).strip().rstrip(';')
            H = delim.join(H).strip().rstrip(';')
            dict.update({'C': vals[0].strip().rstrip(';'), 'F': F, 
                        'G': G,'H': H, 'I': vals[-1].strip().rstrip(';')})

            if "average" in vals[1] or "size" in vals[1]:
                vals[1] = re.sub(r"([^,]*)\sx\s([^,]*)\s=\s([^,]*)", r"\1 = \3 x \2 = \3", vals[1])
            dims = re.split(r"x|and|,", vals[1])
            dims = [s.strip() for s in dims]
            if len(dims)==2:
                dict.update({'D': dims[0],'E':  dims[1]})
            else:
                h = dims[::2]
                w = dims[1::2]
                height = delim.join(h)
                width = delim.join(w)
                dict.update({'D': height,'E': width})

        if len(lines)>=5:
            pattern4 = r"([a-z])\s[^a-z0-9\s]+\s*([\u0590-\u05fe])"
            lines[4] = re.sub(pattern4, r"\1 \2", lines[4])
            lines[4] = re.sub(r"\b\S*JL\S*\b", r" ", lines[4], flags=re.IGNORECASE)
        K = lines[1] + '; ' + lines[4] if len(lines)>=5 else lines[1]

        nonPattern = r"(non)\s*(-)\s*(standard\s*\w*\s*vocalization).+?(?=become|occur|\.\s\[|[a-zA-Za-z:]\s\[[^0-9]\]\s|\.\s[A-Z]|$)"
        K = re.sub(nonPattern, r"\1\2\3", K)
        K = re.sub(r"(vocalization)$", r"\1.", K)
        K = re.sub(r"(vocalization)\s*[a-zA-Za-z:]\s\[", r"vocalization are: [", K)
        K = re.sub(r"(vocalization)(?=[A-Za-z])", r"\1 ", K)
        K = K.replace("The non-standard vocalization.", "Examples of non-standard vocalization.")
        K = re.sub(r"(vocalized).+?(?=$|\.)", r"\1", K)

        formPattern = r"(non-standard form[s]?)[^.]*(\.)?"
        K = re.sub(formPattern, r"\1.", K)
        vocPattern = r"(vocalized with the non-standard)[^.]*(\.)?"
        K = re.sub(vocPattern, r"\1 form.", K)

        signsPattern = r"(?:This|the)\s*(sign|line ending)([s])?.+?(\.|,|\sare|\sis)"
        K = re.sub(signsPattern, lambda match: match.group(1)+"s"+match.group(3) if (match.group(3)==" are" or match.group(2)=="s") else "a "+match.group(1)+match.group(3), K, flags=re.IGNORECASE)
        K = re.sub(r"[\.]\s+[a-z]", lambda match: match.group(0).upper(), K)

        K = re.sub(r"\[\s*1\s*(?=[^\]])|(?<=[^\[])\s*1\s*\]", "[ ]", K)
        onePattern = r"([\u0590-\u05fe]|\s)(1)([\u0590-\u05fe])" # [
        onePattern2 = r"([\u0590-\u05fe])(1)([\u0590-\u05fe]|\s)" # ]
        K = re.sub(onePattern, r"\1[\3", K)
        K = re.sub(onePattern2, r"\1\]\3", K)

        K = re.sub(r"(?<=\d)־", ",", K)

        K = re.sub(r"(\w) (\.)", r"\1\2", K)

        K = re.sub(r"(\.\s*\.)|\s*\.", ".", K)

        K = re.sub(r"(as follows)[:,]\s*([~=&\)\-0-9–—])+(?=\.|$|\s*[A-Za-z])", "", K, flags=re.IGNORECASE)

        K = re.sub(r"(?<=[A-Za-z0-9])([^A-Za-z0-9]+for[^A-Za-z0-9\s][^.]*)+(?=\.|$)", "", K)
        
        # bracketPattern = r"([A-Za-z]{3,})\s*\[\s?\](\s*[A-Za-z.])"



        titlePattern = r"((?:T-S\s*\w*\s*\d+\.\d+|Or\.\s*\d+(?:\.\d+)*|Wm.\s*\S*\s*\d+(?:\.\d+)*)(?:\sand\s\d+)*)"
        refs = re.findall(titlePattern, K)
        refString = "; ".join(refs).strip()

        dict.update({'M': refString, 'K': K.strip().rstrip(';'), 'J': lines[2].rstrip(';')})
        rows.append(dict)
        

    df = pd.DataFrame(rows, 
        columns=['A','B','C','D','E','F','G','H','I','J','K','L','M'])
    df.to_csv("test.csv", index=False)

    # print(len(problems), problems)

if __name__ == '__main__':
    main()
