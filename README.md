## Puppeteer_Cheerio
Web scraper utilizing puppeteer to simulate user interaction and bypass tricky authentication. From there cheerio is used to scrape neccessary data then continue on. Array list of search queries is used for mass data gathering.

## Motivation
While working as a research specialist during a temp role, I realized I could cut my time in half with a bot... allowing me to get much further on the project. 

## Features
It handles a list of search queries and feeds you back the declared inputs from the searched data.

## Installing

Clone the package then install the dependencies in your text editor

```
npm i -g
```

Now insert your input information to have your profile used. Create a file called input.js and insert your confidential data

```javascript
var input = {
  "username": "johndoe@gmail.com",
  "password": "yourpassword"
}

module.exports = input;
```

You can now start thinking about making a csv list and customizing the csv file at the top of input.js to meet your query needs. The querys will be created and push into a list which will then be run through on a loop till completed. 

```javascript
fs.createReadStream('./csvFiles/JohnDoe_Concat.csv')
.pipe(csv())
.on('data', function(data){
    try {
       donorList.push(data['Concat with City']);
       donorList.push(data['concat with Employer']);
    }
    catch(err) {
    }
})
.on('end',function(){
    console.log(donorList);
});  
```

Next run the code in your terminal

```
node index.js
```


## License
A short snippet describing the license (MIT, Apache etc)

MIT © [JakeDykstra](https://github.com/JakeDykstra)
