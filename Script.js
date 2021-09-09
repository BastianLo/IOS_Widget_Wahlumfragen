

//Datasource: dawum.de (API)
//Licence: ODC-ODbL


/***********************
The variables below are changeable parameters.
***********************/

// Daycount is the default value of days, that will be diplayed in the graph
// e.g. 365 will show the data of the last 365 days
let dayCount = 365

// defines the amount of pixels, which are grouped together by calculating the average values.
// the lower the value, the more precise are the lines in the graph
// a higher value will result in a more flatten and astetic curve
// value 0 will display all the values like retrieved from the datasource
// e.g. value 10 will calculate the average value every 10 pixels, resulting in a better looking, but more unprecise curve
// any value is possible, but i should not be lower than 0 (same as 0) or higher than ~50 (unprecise graph)
let averageThreshold = 10


// the amount of surveys, which are used to calculate the percentages for each party. 
// e.g. value 5 will take the last,5 surveys for each party and calculate the average.
// with the value 1 the script will only use the last survey and thus doesnt calculate any average
let percentageAverageCount = 5


// Thickness of the line in the graph
let lineThickness = 4


let createSurveyCountHeader = true


/***********************
Start of the Script
***********************/



let parties = {
	1:
	{
		"color": Color.white(),
		"name": "CDU/CSU"
	},
	2:
	{
		"color": Color.red(),
		"name": "SPD"
	},
	4:
	{
		"color": Color.green(),
		"name": "Grüne"
	},
	5:
	{
		"color": new Color("#ea0a8e"),
		"name": "Linke"
	},
	3:
	{
		"color": Color.yellow(),
		"name": "FDP"
	},
	7:
	{
		"color": new Color("#009ee0"),
		"name": "AfD"
	}
}

let width = 720
let height = 338

let xborder = 50

let bottomMargin = 50

let xAxisPointCount = 5

let gheight = 200
let gwidth = width - 2 * xborder

let sharemax = 0

const zeroPad = (num, places) => String(num).padStart(places, '0')

let param = args.widgetParameter
if (param != null)
{
	dayCount = args.widgetParameter
}


const w = new ListWidget()
let c = new DrawContext()
await createWidget()


Script.setWidget(w)
Script.complete()
w.presentMedium()


async function createWidget()
{
	w.backgroundColor = new Color("#222222")

	c.size = new Size(width, height)
	c.opaque = false


	const socket = w.addStack();
	socket.layoutHorizontally();
	socket.addSpacer(260)

	const bg = socket.addStack();
	bg.backgroundColor = new Color('#b0b0b0', .6);
	bg.cornerRadius = 3;
	bg.setPadding(2, 4, 2, 4);
	bg.layoutHorizontally()

	const githubWidget = bg.addText('Github');
	githubWidget.url = 'https://github.com/BastianLo/IOS_Widget_Wahlumfragen'
	githubWidget.rightAlignText()
	githubWidget.font = Font.mediumRoundedSystemFont(6);


	w.addSpacer(96)


	let data = await getData()

	let points = createPoints(data)
	drawAxis()    
    if(createSurveyCountHeader){getTodaysSurveys(points)}
	drawGraphLine(points, lineThickness)
	createPercentageHeader(points)

	let img = c.getImage()


	//let d = w.addDate(new Date())
	//d.applyRelativeStyle()
	w.backgroundImage = img
}

function getTodaysSurveys(points)
{
    let arr = points["dates"][2]
    let countToday = arr.filter(obj => {
      var dArr = obj.split("-")
var date = new Date(dArr[0], dArr[1] - 1, dArr[2])
    return (date.getDate()==new Date(Date.now()).getDate()) &&(date.getMonth()==new Date(Date.now()).getMonth()) &&(date.getYear()==new Date(Date.now()).getYear()) }).length
    let countYesterday = arr.filter(obj => {
      var dArr = obj.split("-")
var date = new Date(dArr[0], dArr[1] - 1, dArr[2])
    return (date.getDate()==new Date(Date.now()).getDate()-1) &&(date.getMonth()==new Date(Date.now()).getMonth()) &&(date.getYear()==new Date(Date.now()).getYear()) }).length
    
    c.setTextColor(Color.white())
    c.setFont(Font.mediumSystemFont(15))
    c.drawText("Umfragen      Heute: "+countToday.toString()+ "     Gestern: "+countYesterday.toString(), new Point(xborder+170, 0))
  
}

function createPercentageHeader(data)
{
	c.setFont(Font.mediumSystemFont(25))

	x = 0
	y = 20
	for (var party in parties)
	{

		c.setTextColor(parties[party]["color"])
		let per = Math.round(eval(data["share"][party].slice(-percentageAverageCount).join("+")) / percentageAverageCount * 10) / 10
		c.drawText(parties[party]["name"] + ": " + per + "%", new Point(xborder + gwidth / 3 * x, y))
		x += 1
		if (x == 3)
		{
			x = 0
			y = 50
		}
	}


}


function drawAxis()
{
	let axiscolor = new Color("#49484b")
	drawLine(new Point(xborder, height - bottomMargin), new Point(width - xborder, height - bottomMargin), 2, axiscolor)
	drawLine(new Point(xborder, height - bottomMargin), new Point(xborder, height - bottomMargin - gheight), 2, axiscolor)

	c.setTextColor(Color.white())
	c.setFont(Font.mediumSystemFont(15))


	let legendpoints = visiblePercentage / 10
	for (var i = 1; i <= legendpoints; i++)
	{
		let y = height - bottomMargin - (gheight * i / legendpoints)
		drawLine(new Point(xborder - 5, y), new Point(xborder + 5, y), 2, axiscolor)
		drawLine(new Point(xborder, y), new Point(width - xborder, y), 0.4, new Color("#CDCDCD"))
		c.drawText((i * 10).toString() + "%", new Point(xborder - 40, y - 10))
	}
	if (percentageAverageCount > 1)
	{

		c.setFont(Font.mediumSystemFont(20));
		c.drawText("ø = " + percentageAverageCount.toString(), new Point(620, 20))

	}
	for (var i = 0; i < xAxisPointCount + 1; i++)
	{
		drawLine(new Point(xborder + i * gwidth / xAxisPointCount, height - bottomMargin - 5), new Point(xborder + i * gwidth / xAxisPointCount, height - bottomMargin + 5), 2, axiscolor)
		d = new Date(Date.now() - dayCount * 86400000 + (dayCount * 86400000 * i / xAxisPointCount))

		let dateString = ""
		let xOffset = 0


		if (dayCount / 30 < xAxisPointCount)
		{
			dateString = zeroPad(d.getDate(), 2) + "." +
				zeroPad((d.getMonth() + 1).toString(), 2) + "." + d.getFullYear().toString().substr(-2)
			if (i == xAxisPointCount)
			{
				xOffset = 45
			}
			else
			{
				xOffset = 30
			}

		}
		else
		{
			dateString = zeroPad((d.getMonth() + 1).toString(), 2) + "." + d.getFullYear().toString().substr(-2)
			xOffset = 25
		}


		c.drawText(dateString, new Point(xborder - xOffset + i * gwidth / xAxisPointCount, height - bottomMargin + 10))

	}
}

function createPoints(data)
{

	for (var i = 0; i < data.length; i++)
	{
		for (var res in data[i]["Results"])
		{
			let share = data[i]["Results"][res]
			if (share > sharemax)
			{
				sharemax = share
			}
		}
	}
	visiblePercentage = sharemax + 2

	points = {
		"share":{},  
        "dates":{}
	}
	for (var i = 0; i < data.length; i++)
	{
		let d = Date.parse(data[i]["Date"])
		//     log(d)
		for (var res in data[i]["Results"])
		{
			if (points[res] == undefined)
			{

				points[res] = []
				points["share"][res] = []  
                points["dates"][res] = []
			}
			let share = data[i]["Results"][res]
			let y = height - bottomMargin - share * gheight / 100 * (100 / visiblePercentage)

			let x = (1 - ((Date.now() - d) / 86400000 / dayCount)) * gwidth + xborder

			if (points[res][points[res].length - 1] != undefined)
			{
				let diff = x - points[res][points[res].length - 1][0]
				points["share"][res].push(share)
                points["dates"][res].push(data[i]["Date"])
				if (diff < averageThreshold)
				{
					points[res][points[res].length - 1][2] = share
					points[res][points[res].length - 1][1] = (points[res][points[res].length - 1][1] + y) / 2
				}
				else
				{
					points[res].push([x, y])
				}

			}
			else
			{
				points[res].push([x, y])
			}


		}


	}
	return points
}


async function getData()
{
	//url = "https://api.dawum.de/newest_surveys.json"//   
	url = "https://api.dawum.de"
	let req = new Request(url)
	let json = await req.loadJSON()
	let surveys = json["Surveys"]
	let filtered = []
	for (var key in surveys)
	{
		d = Date.parse(surveys[key]["Date"])

		if (Date.now() - dayCount * 86400000 < d && surveys[key]["Parliament_ID"] == 0)
		{
			filtered.push(surveys[key])
		}
	}
	return filtered
}


function drawGraphLine(points, width = 3)
{

	for (var party in parties)
	{
		for (var i = 0; i < points[party].length - 1; i++)
		{

			drawLine(new Point(points[party][i][0], points[party][i][1]), new Point(points[party][i + 1][0], points[party][i + 1][1]), width, parties[party]["color"])
		}
	}

}

function drawLine(point1, point2, width, color)
{
	const path = new Path();
	path.move(point1);
	path.addLine(point2);
	c.addPath(path);
	c.setStrokeColor(color);
	c.setLineWidth(width);
	c.strokePath();
}

