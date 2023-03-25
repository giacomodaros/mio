import csv
from datetime import datetime

# Open the CSV file and read its content
with open("matter_history.csv", encoding="utf8") as csv_file:
    csv_reader = csv.reader(csv_file)
    # Skip the header row (if it exists)
    next(csv_reader, None)
    
    # Create a dictionary to store the articles by month
    articles_by_month = {}
    
    # Iterate over each row in the CSV file
    for row in csv_reader:
        # Extract the data from the row
        title = row[0]
        link = row[3]
        interaction_date_str = row[8]
        
        # Check if the interaction date is not empty
        if interaction_date_str:
            # Parse the interaction date into a datetime object
            interaction_date = datetime.strptime(interaction_date_str, "%Y-%m-%d %H:%M:%S")

            # Get the month and year from the interaction date
            month_year_str = interaction_date.strftime("%B %Y")

            # Add the HTML link to the list of items for the current month
            if month_year_str in articles_by_month:
                articles_by_month[month_year_str].append((title, link))
            else:
                articles_by_month[month_year_str] = [(title, link)]
    
    # Create a list of tuples with the month-year string and the articles for that month
    articles_by_month_list = [(k, v) for k, v in articles_by_month.items()]
    
    # Sort the list of tuples in reverse chronological order
    articles_by_month_list.sort(key=lambda x: datetime.strptime(x[0], "%B %Y"), reverse=True)
    
    # Create an empty string to store the HTML output
    html_output = ""
    
    # Iterate over each month and its articles
    for month_year, articles in articles_by_month_list:
        # Create an HTML header for the current month-year
        html_header = f"<h2>{month_year}</h2>"
        
        # Create a list of HTML links for the articles in the current month-year
        html_links = [f'<li><a href="{link}">{title}</a></li>' for title, link in articles]
        
        # Combine the HTML links into an unordered list
        html_unordered_list = "<ul>\n" + "\n".join(html_links) + "\n</ul>"
        
        # Combine the HTML header and unordered list into a single string
        html_month_output = html_header + html_unordered_list
        
        # Add the HTML output for the current month to the overall HTML output
        html_output += html_month_output
    
    # Save the HTML output to a file
    with open("matter_history.html", mode="w", encoding="utf8") as html_file:
        html_file.write(html_output)
    
    # Print a message indicating the file has been saved
    print("The HTML file has been saved to matter_history.html.")