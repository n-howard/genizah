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
        if "Or" in label:
            label = re.sub(r"(Or\.)\s*(\d+)(?:\s)([\w\.]+)", r"\1 \2.\3", label)
            tPattern = r"(T-S\s*\w*\s*\d+\.\d+|Or\.\s*\d+(?:\.\w+)*|Wm.\s*\S*\s*\d+(?:\.\d+)*)"
            subLabel = re.findall(tPattern, label)
            label = subLabel[0]
        if "Misc." in label:
            label = label.replace("Misc.", "Misc. ")
        bibDict[label] = bibEntry

    rows = []

    realWords = ["non", "Judaeo", "Kittel", "prayer", "writ", "megillah", "pen", "branch", "Strauss", "right", "line", "one", "prev", "page", "title", 
                     "century","poll", "book", "al-Rida", "Dhual", "folio", "wa", "week", "ha-", "quarter", "drawn", "word", "half", "Tel", "end", "crossed", "pre", "al-", 
                     "Mosin", "wide", "he-", "ad-", "hand", "Judeao", "ink", "double", "space", "standard", "small", "side", "bibl"]
    # hebCount = 0
    # hebList = []

    for entry in entries:
        
        dict = {}
        entry = (
            entry
                .replace("mutilated", "damaged")
                .replace("mutilation", "damage")
                .replace(";\n", "; ")
                .replace("\n;", ";")
                # .replace(",", ";")
                .replace("  ", " ")
                .replace("Song of Solomon", "Song of Songs")
                .replace("Massorah", "Masora")
                .replace("- ", "-")
                .replace(" ;", ";")
                .replace(" ,", ",")
                .replace("®", "")
                .replace("ר lines", "7 lines")
                .replace("ר leaves", "7 leaves")
                .replace("׳,", ";")
                .replace("ו־", "ר")
                .replace("0f", "of")
                .replace("*", "'")
                .replace("hafiarah", "haftarah")
                .replace(";;", ";")
                .replace(",,", ",")
                .replace(". Hebrew;", ".\nHebrew;")
                .replace(", On", ". On")
                .replace(". which", ", which")
                .replace("hafiarot", "haftarot")
        )
        
        entry = re.sub(r"(?<=\.)\s*י+\]", "", entry)
        paPattern = r"([.;])\s*(Parchment|Paper|leather)"
        entry = re.sub(paPattern, r"\1\n\2",entry, flags=re.IGNORECASE)
        entry = re.sub(r"(?<=;)\n(?=\d)", " ", entry)
        # pattern = r"(The tetragrammaton is (?:sometimes\s|once\s)*abbreviated)[^.]*"
        # entry = re.sub(pattern, r"\1", entry, flags=re.IGNORECASE)
        # entry = re.sub(r"(The tetragrammaton is abbreviated.)\s*[\u0590-\u05fe]*\]", r"\1", entry, flags=re.IGNORECASE)
        # entry = re.sub(r"(The tetragrammaton is abbreviated.)\S*", r"\1", entry, flags=re.IGNORECASE)
        pattern2 = r"(damaged.*?\.) "
        entry = re.sub(pattern2, r"\1\n", entry, flags=re.IGNORECASE)
        specialPattern = r"([A-Za-z])[־׳]"
        entry = re.sub(specialPattern, r"\1", entry)
        entry = re.sub(r"\s([\u05d0-\u05ea])\s([\u05d0-\u05ea])", r"\1\2", entry)
        entry = re.sub(r"([\u05d0-\u05ea])\s([\u05d0-\u05ea])\s", r"\1\2", entry)
        entry = re.sub(r"([A-Za-z0-9])([\u0590-\u05fe])", r"\1 \2", entry)
        entry = re.sub(r"([\u0590-\u05fe])([A-Za-z0-9])", r"\1 \2", entry)
        entry = re.sub(r"(\d)[-—–]ר", r"\1-7", entry)
        entry = re.sub(r"ר[-—–](\d)", r"7-\1", entry)
        entry = re.sub(r"(?<=[\s\d])[l](?=[-\s\d—–:vr])", r"1", entry)
        entry = re.sub(r"(\d) (r|v) ", r"\1\2", entry)
        entry = re.sub(r"\n(with|damaged|rubbed|missing|piece|many|of|or|small|few|preserved|repaired|only|and|illegible|a|on|letter|word|text|identified|slightly|\(incomplete\)|side|\)|folio|lines|in|form|follow|fragment|\(|is|abbreviated)", r" \1", entry)
        entry = re.sub(r"([,;x])\n(\d)", r" \1 \2", entry, flags=re.I)

        entry = entry.replace(" Example", "\nExample")
        
        entry = re.sub(r"([A-Za-z]{2,})-\s*([A-Za-z]{2,})", lambda match: match.group(1)+ "-" +match.group(2) if match.group(1)+ "-" +match.group(2) in spell or any(real.lower() in (match.group(1)+ "-" +match.group(2)).lower() for real in realWords) else match.group(1)+match.group(2), entry, flags=re.IGNORECASE)

        pattern = r"(The tetragrammaton is (?:sometimes\s|once\s)*abbreviated)[^.]*"
        entry = re.sub(pattern, r"\1", entry, flags=re.IGNORECASE)
        entry = re.sub(r"(The tetragrammaton is abbreviated.)\s*[י\]\[]{2,}(\sי)*", r"\1", entry, flags=re.IGNORECASE)
        entry = re.sub(r"(The tetragrammaton is abbreviated.)\S*", r"\1", entry, flags=re.IGNORECASE)
        
        # entry = re.sub(r"(?<=[^\u25a0-\u25ff\s\[\]])[\u25a0-\u25ff](?=[^\u25a0-\u25ff\s\[\]])", "", entry)
        entry = re.sub(r"decorated\s*[\u25a0-\u25ff]", r"decorated ס", entry)
        entry = re.sub(r"[\u25a0-\u25ff•]", "", entry)

        entry = re.sub(r"(\d{1,2})(\d{1,2})\s*[\u0590-\u05fe]\s*lines", r"\1-\2 lines", entry)

        entry = re.sub(r"([\u0590-\u05fe])\s*([;,])\s*([\u0590-\u05fe])", r"\1 \2\3", entry)

        entry = re.sub(r"(\d) (Hebrew)", r"\1\n\2", entry)
        
        entry = re.sub(r"[ ]{2,}", r" ", entry)

        entry = re.sub(r"([a-z]) (damaged)", r"\1; \2", entry)

        entry = re.sub(r"comer", r"corner", entry, flags=re.I)

        

        lines = entry.split("\n")
        lines[:] = [x for x in lines if x]

        if len(lines)==0:
            continue
        
        dict['A'] = lines[0].strip().rstrip(';')

        tPattern = r"(T-S\s*\w*\s*\d+\.\d+|Or\.\s*\d+(?:\.\w+)*|Wm.\s*\S*\s*\d+(?:\.\d+)*)"
        titles =  re.findall(tPattern, lines[0])
        if len(titles) == 0:
            titles.append(lines[0])
            
        dict['L'] = bibDict[titles[0]] if titles[0] in bibDict else ''
        

        if re.findall(r"\[\d+\]$", lines[-1]):
            lines.remove(lines[-1])

        if "tetragrammaton is abbreviated" in entry or bool(re.search(r"(liturgical|liturgy)", entry, flags=re.IGNORECASE)) or "child" in entry or "children" in entry or bool(re.search(r"writing[\-\s]*exercise", entry)) or "Haggadah" in entry or "Mezuzah" in entry or "tefillin" in entry or "Maimonedes" in entry or "Midrash" in entry or "Mishnah" in entry or "part of a letter" in entry or "only pen-exercises" in entry or bool(re.search(r"non-biblical", entry, flags=re.I)):
            dict.update({'B': "Bible-Related"})

        elif (bool(re.search(r"unidentified", entry, flags=re.IGNORECASE)) and not bool(re.search(r"Hebrew Bible", entry, flags=re.IGNORECASE))):
            dict['B'] = "Bible-Related"

        else:
            dict.update({'B': "Bible"})

        if (not bool(re.search(r"(lea(ves|f))|line|col|size|cm|(\d\s*x\s*\d)|dama", entry, flags = re.IGNORECASE))) and len(lines)>2:
            lines[1] = " ".join(lines[1:])
            lines = lines[:2]

        if len(lines)>=3:
            if re.search(r"(^and)|(^with)|\d{2,}|(Mezuzah)|(^Targum)|(liturgical)|(Tephillin)|(manuscript)|(fragment)|(Triennial)", lines[2], flags=re.I):
                lines[1] = " ".join(lines[1:3])
                lines.remove(lines[2])
               
            # if ". Hebrew;" in lines[1] or bool(re.search(r"\d Hebrew;", lines[1])):
            if " Hebrew;" in lines[1]:
                lines[1] = re.sub(r" (Hebrew;)", r"\n\1", lines[1])
                newLines = lines[1].split("\n")
                lines[1]=newLines[0]
                lines.insert(2, newLines[1])
               

        if len(lines) < 3:
            # if bool(re.search(r"[\u0590-\u05fe]", entry)):
            #     hebCount+=1
            #     hebList.append(lines[0]) 
            if "archment" and "aper" in entry:
                dict['C'] = "Parchment; Paper"
            elif "archment" in entry:
                dict['C'] = "Parchment"
            elif "aper" in entry:
                dict['C'] = "Paper"
            elif "eather" in entry:
                dict['C'] = "Leather"
            if "ebrew" in entry:
                dict['J'] = "Hebrew"
            elif "ramaic" in entry:
                dict['J'] = "Aramaic"
            elif "rabic" in entry:
                dict['J'] = "Arabic"
            if len(lines) > 1:
                lines[1] = re.sub(r";\s*(parchment|paper|leather)\.*$", r"", lines[1], flags=re.I)
                dict['K'] = lines[1]
            if "See" in entry and "Klein" not in entry:
                problems.append(",".join(lines))
                continue
            elif "Klein" in entry and len(lines[1])<20:
                continue
            rows.append(dict)
            continue


        if "archment" in lines[2] or "aper" in lines[2] or "eather" in lines[2]:
            lines.insert(2, "")
        
        

        
        
        # if len(lines)>=4:
        #     if "archment" not in lines[3] and "aper" not in lines[3]:
        #         lines[2] = " ".join([lines[2], lines[3]])
        #         lines.remove(lines[3])
        
        if len(lines) >= 4:
            # lines[3] = lines[3].replace(",", ";")
            lines[3] = re.sub(r"(?<=\d)־", "-", lines[3])
            vals = lines[3].split(";")
            if len(vals)<=1:
                if "aper" or "archment" or "eather" in lines[3]:
                    dict['C'] = lines[3].strip().rstrip(';').title()
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
            C = []
            if "archment" not in entry and "aper" not in entry and "eather" not in entry:
                vals.insert(0, "")
            delim = "; "
            for val in vals:
                if "dama" in val:
                    continue
                elif "size" in val or "cm" in val or bool(re.search(r"\d\s*x\s*\d", val)):
                    continue
                elif "col" in val:
                    G.append(val.strip())
                elif "line" in val:
                    H.append(val.strip())
                elif "leaf" in val or "leaves" in val and "line":
                    F.append(val.strip())
                elif "archment" in val or "aper" in val or "eather" in val:
                    C.append(val.strip())
            G = delim.join(G).rstrip(';').replace(".", "").strip()
            F = delim.join(F).rstrip(';').replace(".", "").strip()
            H = delim.join(H).rstrip(';').replace(".", "").strip()
            C = delim.join(C).rstrip(';').replace(".", "").strip().title()
            if bool(re.search(r"[a-z]\. [A-Z]", vals[-1])):
                splitLines = re.split(r"\. ", vals[-1])
                vals[-1] = splitLines[0]
                if len(lines)>4:
                    lines[4] = ". ".join(splitLines[1:], lines[4])
                else:
                    lines.append(". ".join(splitLines[1:]))
            dict.update({'C': C, 'F': F, 
                        'G': G,'H': H, 'I': vals[-1].strip().rstrip(';:.')})
            
            vals[1] = re.sub(r"([^x\.](?:[\d])+),([\d])+", r"\1.\2", vals[1])
            if "average" in vals[1] or "size" in vals[1]:
                vals[1] = re.sub(r"([0-9a-zA-Z\.\s]*)\sx\s([0-9a-zA-Z\.\s]*)\s[=\()]+\s*([0-9a-zA-Z\.\s]*)[\)]*", r"\1 = \3 x \2 = \3", vals[1])
            vals[1] = re.sub(r"(\d)\.\s[l]", r"\1.1", vals[1])
            dims = re.split(r"and|x|,", vals[1], flags=re.IGNORECASE)
            dims = [s.strip() for s in dims]
            dims[:] = [x for x in dims if x]
            if len(dims)==2:
                dict.update({'D': dims[0],'E':  dims[1]})
            else:
                h = dims[::2]
                w = dims[1::2]
                height = delim.join(h)
                width = delim.join(w)
                dict.update({'D': height,'E': width})
        
        if len(lines)>=5:
            pattern4 = r"([a-z])\s[^a-z0-9\u0590-\u05fe\s\[\]\(\)]+\s*([\u0590-\u05fe])"
            lines[4] = re.sub(pattern4, r"\1 \2", lines[4])
            
            lines[4] = re.sub(r"\b\S*JL\S*\b", r" ", lines[4], flags=re.IGNORECASE)
        
        K = lines[1] + '; ' + lines[4] if len(lines)>=5 else lines[1]

        K = re.sub(r"([^\-:\d](?:\d)+);(\d+)", r"\1:\2", K)

        nonPattern = r"(non)\s*(-)\s*(standard\s*)(Tiberian\s*vocalization|Tiberian|vocalization)(\s*in (?:[^,](?!are))*)*.+?(?=\s*become|\s*occur|\s*On|\s*Folio|\s*[A-Z][a-z]|\.\s\[|[a-zA-Z:]\s\[[^0-9\s]\]\s|\.\s+[A-Z\u05d0-\u05ea]|$)"
        K = re.sub(nonPattern, r"\1\2\3\4", K)
        K = re.sub(r"(vocalization)\s*(On)", r"\1. \2", K)
        K = re.sub(r"(vocalization)$", r"\1.", K)
        K = re.sub(r"([A-Za-z0-9])$", r"\1.", K)
        K = re.sub(r"(vocalization)\s*[a-zA-Za-z:]\s\[", r"vocalization are: [", K)
        K = re.sub(r"(vocalization)(?=[A-Za-z]{2,})", r"\1 ", K)
        # K = K.replace("The non-standard vocalization.", "Examples of non-standard vocalization occur.")

        K = re.sub(r"(?:The|Examples of|An example of|Example of|the|contains the)(?:\sconsistently)* (non-standard\s*)(Tiberian\s*vocalization|Tiberian|vocalization)(?:\s*occur)?[s]?(\sin the over[^\.]*|\sin the rem[^\.]*|\sin folio[^\.]*)?(\.)", r"examples of \1\2\3 occur.", K, flags=re.IGNORECASE)
        K = re.sub(r"[tT]he (non-standard) (Tiberian\s*vocalization|Tiberian|vocalization) (occurs [a-z\s,\u05d0-\u05ea]+\.)", r"non-standard \2 \3", K)
        K = re.sub(r"[tT]he (non-standard) (Tiberian\s*vocalization|Tiberian|vocalization) (occur [a-z\s,\u05d0-\u05ea]+\.)", r"non-standard \2s \3", K)
        K = re.sub(r"(non-standard vocalization)\.", r"\1s.", K)

        
        formPattern = r"(non-standard form[s]?)[^.]*(\.)?"
        K = re.sub(formPattern, r"\1.", K)
        vocPattern = r"(vocalized with the non-standard)[^.]*(\.)?"
        K = re.sub(vocPattern, r"\1 form.", K)

        signsPattern = r"(?:This|the)\s*(sign|line ending)([s])?.*?(\.|,|are|is|marks|$)"
        K = re.sub(signsPattern, lambda match: match.group(1)+"s "+match.group(3) if (match.group(3)=="are" or match.group(2)=="s") else "a "+match.group(1)+" "+match.group(3), K, flags=re.IGNORECASE)
        K = re.sub(r"[;\.]\s+[a-z](?=[^\.]{3,})", lambda match: match.group(0).upper(), K)

        K = re.sub(r"\[\s*1\s*(?=[^\]0-9])|(?<=[^\[0-9])\s*1\s*\]", "[ ]", K)

        onePattern = r"([\u0590-\u05fe\s])(1)([\u0590-\u05fe])" # [
        onePattern2 = r"([\u0590-\u05fe])(1)([\u0590-\u05fe\s])" # ]
        K = re.sub(onePattern, r"\1[\3", K)
        K = re.sub(onePattern2, r"\1]\3", K)

        K = re.sub(r"([;\.]) And", r"\1 and", K)
        K = re.sub(r"\d[f]+\. [A-Z]", lambda match: match.group(0).lower(), K)

        continuedPattern = r"\[\s*" + re.escape(titles[0]) + r"[,\s]*continued\s*\]"

        K = re.sub(continuedPattern, r"", K, flags=re.IGNORECASE)

        K = re.sub(r"(?<=\d)־", ",", K)
        
        # K = re.sub(r"([A-Za-z]) (\.)(?=\s|$)", r"\1\2", K)

        if not bool(re.search(r"\s*\.\s*\.\s*\.", K)):
            K = re.sub(r"(\.\s*\.)|(?<=[A-Za-z0-9])(\s+\.)|\s+\.$|(?<=[\u05d0-\u05ea])\s+\.(?=\s[A-Za-z])", ".", K)

        K = re.sub(r"(as follows)[:,]\s*([~=&\)\-0-9–—])+(?=\.|$|\s*[A-Za-z])", "", K, flags=re.IGNORECASE)

        K = re.sub(r"(?<=[A-Za-z0-9])([^A-Za-z0-9]+for[^A-Za-z0-9\s][^.]*)+(?=\.|$)", "", K)

        K = re.sub(r"BH[jJ\W]", "BH3", K)

        K = re.sub(r"(decorated)\s*[&0obptם\u25a0-\u25ff](s)*(?=\.|,|\s|'|\=|\)|\!|$)", r"\1 ס\2", K, flags=re.IGNORECASE)

        K = re.sub(r"See Plate \d+\.*", "", K, flags=re.IGNORECASE)

    
        # K = re.sub(r"[\[\]]\s*(\S)\s*[\]\[]", r"[\1]", K)

        K = K.replace(" ס s", " סs")

        K = re.sub(r"(?<=[\u05d0-\u05ea])(\s*is often vocalized)\s*([\u05d0-\u05ea]+)", r"\1 in a non-standard form", K)

        K = re.sub(r" n([\s,\.])", r" ח\1", K)
        K = re.sub(r"\s([\u0590-\u05fe])\s(s)([\s,\.])", r" \1\2\3", K)

        K = K.replace("יטראל", "ישראל").replace(";;", ";").replace(",,", ",")

        K = re.sub(r"[ ]{2,}", r" ", K)

        K = re.sub(r"(\S)([;,])(\S)", r"\1\2 \3", K)

        K = re.sub(r"\.\s*\.\s*\.", r"...", K)

        # # HEBCOUNT START
        # if bool(re.search(r"[\u0590-\u05fe]", K)):
        #     hebCount+=1
        #     hebList.append(lines[0]) 
        # # HEBCOUNT END

        # if 'I' in dict:
        #     if bool(re.search(r"[\u0590-\u05fe]", dict['I'])):
        #         hebCount+=1
        #         hebList.append(lines[0]) 
        
        # bracketPattern = r"([A-Za-z]{3,})\s*\[\s?\](\s*[A-Za-z.])"
        

        if (K.count("]")==1 and "[" not in K) or (K.count("[")==1 and "]" not in K):
            K = (
                K
                    .replace("]", "")
                    .replace("[", "")
            )

        K = re.sub(r"([a-z]+\s*\d+[rv])([a-z]+)", r"\1 \2", K)

        titlePattern = r"((?:T-S\s*[\w\.]*\s*\d+\.\d+|Or\.\s*\d+(?:\.\w+)*|Wm.\s*\S*\s*\d+(?:\.\d+)*)(?:[a-z])?(?:\sand\s\d+)*)"
        refs = re.findall(titlePattern, entry)
        if len(titles)>1:
            refs = refs + titles[1:]
        if titles[0] in refs:
            refs.remove(titles[0])
        if lines[0] in refs:
            refs.remove(lines[0])
        refs = list(set(refs))
        refString = "; ".join(refs).strip()

        if not bool(re.search(r"\.$", K)):
            K = K + "."

        

        dict.update({'M': refString, 'K': K.strip().rstrip(';'), 'J': lines[2].rstrip(';').replace(".","").strip()})



        rows.append(dict)
        
    df = pd.DataFrame(rows, 
        columns=['A','B','C','D','E','F','G','H','I','J','K','L','M'])
    df.to_csv("test.csv", index=False)
    
    # curr = "Or.1080.9.4"
    # last = "T-S AS 64.50"
    # completeSoFar = hebList.index(curr)+1
    # percent = (completeSoFar/len(hebList))*100
    # # print(hebList, "\n", hebCount, "\n",completeSoFar , "\n", str(percent)+"%" )
    # print(str(hebCount) + "\n" + str(completeSoFar) + "\n" + str(percent)+"%" )
    # diff = completeSoFar - (hebList.index(last)+1)
    # print(diff)

    # print(len(problems), problems)

if __name__ == '__main__': 
    main()
