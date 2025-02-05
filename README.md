# Assignment 3 - Persistence: Two-tier Web Application with Database, Express server, and CSS template

===

## Todo List

Alexander Beck, [https://a3-alexanderbeck.onrender.com](https://a3-alexanderbeck.onrender.com)

The goal of this application is to be able to have a todo list for a logged in user. It allows users to log in with Github and add, edit, delete, and clear tasks. The authentication strategy used is Github, since I assumed that all TA's grading would have a Github account. The CSS framework I used is Fomantic-UI because it seemed like a modern framework. I did not make any changes to the framework, however I did add a `hover` to the items in the todo list. Some Express middlewear I used are: A post event, for when the user submits something. This middlewear checks to see if the user edited something, and if they did not, it adds it to the DB. Another middlewear I used is clear, which I used when the user wanted to clear their data. It removes all data associated with a user from the DB. I also used load, which checks to see if the user is logged in, and if they are, gets their data from the DB. I used delete, which deleted a single item from the DB. Finally, I used github auth, from passport.js, to log in a user.

I used a few external libraries in the server, such as `dotenv` (for keeping credentials out of deployment), `cookie-parser` (to make editing cookies simpler), `passport-github` (for using OAuth with GitHub), and `mongodb` (for connecting to MongoDB).

## Technical Achievements

- **Tech Achievement 1**: I used OAuth authentication via the GitHub strategy
- **Tech Achievement 2**: I hosted the website using [Render](https://render.com). Render is different then Glitch in that it can connect directly to your Github, rather than having to provide a link to the repository. This made it easier to keep the page up-to-date. It was much more difficult to get working because of the npm packages, and it was difficult to get the node server running as well. I eventually got it by switching from Static Site to Web Service.
- **Tech Achievement 3**: I implemented many changes to increase the lighthouse score on the webpage. Changes include attempting to host files on the server instead of using a CDN (this did not work). Also, used `async` and `defer`, as well as `preconnect` and `crossorigin` to speed up the loading process of different sources. Used less styles in `main.css` (only a `hover` style). Created `robots.txt`, `sitemap.txt`. Added `meta` tags.
Unfortunately, I was unable to get the Performance score up to 100. However, I would like to make it clear that it is entirely due to the CSS framework, and not because of my code. It is mostly due to unused code in the CSS, and I have tried numerous times to host it myself to reduce render blocking. This dropped the performance score down to 80, so I am stuck using a CDN, and am only able to achieve a 98 on performance. *If it were not for the framework, I would have a 100 on performance, and I have tried all that I can to improve this score*.

### Design/Evaluation Achievements

- **Design Achievement 1**: I followed the following tips from the W3C Web Accessibility Initiative...
  - *Associate a label with every form control*: I added a `for` attribute for every label
  - *Help users avoid and correct mistakes*: I made the date input an actual `date` type to avoid having users type out dates
  - *Reflect the reading order in the code order*: All items in the HTML are in the order that they appear on the page
  - *Ensure that all interactive elements are keyboard accessible*: I added tab-indexes to the form elements to ensure that they are keyboard accessible.
  - *Don’t use color alone to convey information*: I used text to convey information
  - *Ensure that form elements include clearly associated labels*: I added labels to elements that require them.
  - *Provide easily identifiable feedback*: Added an alert to ensure that the user understands that all fields must be filled out
  - *Use headings and spacing to group related content*: I used both headings and sections to divide content. An example is the use of the `segment` class that is within the framework I am using, which makes sections clear.
  - *Using ARIA landmarks to identify regions of a page*: I added landmarks such as `role` to different aspects of page. Also changed the JS to include `aria-hidden` when disabling items
  - *Ensuring that a contrast ratio of at least 7:1 exists between text (and images of text) and background behind the text*: Used the recommended `Contrast Analyser – Application` to examine the contrast of the page.
  - *Timeouts*: Changed the cookie timeout to be greatly increased (20 hours) to ensure that the user has no timeout interuptions
  - *Providing a submit button to initiate a change of context*: Not only added a submit button for context, but also added a Clear, Edit, and Cancel button(s). Submit button also changes to "Update" on certain conditions.

  - **Design Achievement 2**

  > The elements that receive the most contrast on each page are the buttons. They receive the most contrast because they are the action items. The action items, meaning what the user has to do to do make the page run, need to pop out. Think the colors in a prompt; the one with the brightest color (or darkest, depending on the theme) is usually the one associated with "continue", whereas the one with the least contrast is associated with "cancel". With my page, I kept this in mind with the buttons. Another way I used contrast is with the login section. It is darker than the rest of the page, which ensures that the user will read that section first.

  > Throughout the site, I repeatedly used tables and flexible items. For example, the primary output of the site is within a table. The table is flexible in that all items are the same width, and the table resizes itself when the page is resized. Additionally, I used bold fonts as a way to describe categories. Labels (and categories) were placed above the items, such as the labels in the form and the headers in the table. Another thing I used repeatedly in the site were buttons. The buttons represented the action items of the site, and all the buttons had the same style. The edit button, which you can only see by hovering over an item in the todo list, is in the same place for all of the rows.

  > I aligned the page by having everything in the center. It has the login at the top of the page, the form in the middle, and the output at the bottom. The output is below the input as it intuitively makes sense. The input and the table are not visible when the user is not logged in, and the login button is not visible when the user is logged in. When the user is logged in, there is a welcome message, which is in the same place as the login button. This is so that if the user wants to check and see if they are logged in or not, they can look in the same place. The input and the login are connected, and the out is separate from the input.

  > I used proximity to make buttons easier to find. An example is that the submit button is next to the clear button, and the cancel button will appear next to those (provided the context for the cancel button is there, meaning a user is editing an item in the todo list). The cancel button is not down next to the edit button, which is on each row, because it is not convenient to go down to the output to cancel any changes done in the input. The output is a table that has headers at the top of the table. This makes it so that the user can look at the top and see what is on each row, and by proximity the user can determine that if the row above the one they are looking at is in category A, the one they are looking at will also be in category A.
