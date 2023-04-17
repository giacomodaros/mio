import csv

# Open the CSV file and read its content
with open("matter_history.csv", encoding="utf8") as csv_file:
    csv_reader = csv.reader(csv_file)
    # Skip the header row (if it exists)
    next(csv_reader, None)
    
    # Create an empty list to store the HTML list items
    html_list = []
    
    # Iterate over each row in the CSV file
    for row in csv_reader:
        # Extract the data from the row
        title = row[0]
        link = row[3]
        
        # Create an HTML link for the current row
        html_link = f'<a href="{link}">{title}</a>'
        
        # Add the HTML link to the list of items
        html_list.append(html_link)
    
    # Create a copy of the HTML list and reverse its order
    reversed_html_list = list(html_list)
    reversed_html_list.reverse()
    
    # Combine the HTML list items into an unordered list
    html_unordered_list = '<ul>\n<li>' + '</li>\n<li>'.join(reversed_html_list) + '</li>\n</ul>'
    
    # Save the HTML unordered list to a file
    with open("matter_history.html", mode="w", encoding="utf8") as html_file:
        html_file.write(html_unordered_list)
    
    # Print a message indicating the file has been saved
    print("The HTML unordered list has been saved to matter_history.html.")
