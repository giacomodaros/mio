import os
from bs4 import BeautifulSoup
import re

input_file_path = "/Users/giacomo/Desktop/I_piccoli_maestri___Notebook.html"
output_file_path = "/Users/giacomo/Desktop/piccoli-maestri.html"
external_css_file_path = "../style.css"

with open(input_file_path, "r", encoding="utf-8") as f:
    html_content = f.read()

soup = BeautifulSoup(html_content, "html.parser")

# Remove sectionHeading elements
for section_heading in soup.find_all(class_="sectionHeading"):
    section_heading.decompose()

# Remove noteHeading elements
for section_heading in soup.find_all(class_="noteHeading"):
    section_heading.decompose()

highlights = soup.find_all(class_="noteText")
book_title = soup.find(class_="bookTitle").text.strip().lower()
authors = soup.find(class_="authors").text.strip().lower()

new_html = BeautifulSoup("""
<!DOCTYPE html>
<html lang="it">
<head>
  <title></title>
  <link rel="icon" type="image/x-icon" href="images/favicon.png">
  <link rel="stylesheet" type="text/css" href="../style.css">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Rubik">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
</head>
<body>
</body>
</html>
""", "html.parser")

new_html.title.string = f"{book_title} - digital orto"

new_html.find("link", rel="stylesheet", type="text/css")["href"] = os.path.join("..", os.path.basename(external_css_file_path))

header = new_html.new_tag("h1", align="left")
header.append(BeautifulSoup("""<a href="../index.html">orto</a> > <a href="../libri.html">libri</a> > """, "html.parser"))
book_info = new_html.new_tag("span")
book_info.string = f"{book_title} - highlights"
header.append(book_info)
new_html.body.append(header)

main_tag = new_html.new_tag("main", **{"class": "lineheight"})
new_html.body.append(main_tag)

for highlight in highlights:
    text = highlight.text.strip()
    text = re.sub(r'Evidenziazione \([a-zA-Z]*\) - Posizione \d+', '', text)

    p_tag = new_html.new_tag("p")
    p_tag.string = text
    main_tag.append(p_tag)

    separator = new_html.new_tag("p", style="text-align:center;")
    separator.string = "---"
    main_tag.append(separator)

with open(output_file_path, "w", encoding="utf-8") as f:
    f.write(str(new_html))