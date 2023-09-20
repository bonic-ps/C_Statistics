const express = require('express')
let dotenv = require('dotenv');
dotenv.config();
const app = express()
const bodyParser = require("body-parser");
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector')

// connection.aggregate()
// connection.find({}).then(res => console.log(res)).catch(err => console.log("error occurd", err))
// connection.aggregate([
//     // {
//     //     $match : { infected : {$gt : 400000}}
//     // },
//     // {$limit : 3},
//     // {$sum : infected}
//     {
//         $group: {
//           _id: 100, // Group by a constant value to calculate the sum across all documents
//           totalAmount: { $sum: "$infected" }, // Calculate the sum of the "amount" field
//         },
//       }
// ]).then(res => console.log(res)).catch(err => console.log("aggregation failed !"))


// TO FIND ALL THE RECOVERED CASES
app.get('/totalRecovered', (req, res) => {

    connection.aggregate([
        {
            $group: {
              _id: "total",
              recovered: { $sum: "$recovered" }, // To calculate the sum.
            },
          }
    ])
    .then(result => {
        console.log(result);
        res.json({data : result[0]})
    })
    .catch(err => {
        console.log("aggregation failed !");
        res.json({message : "Couldnt get the data."})
    })
});

// TO FIND ALL THE ACTIVE CASES
app.get('/totalActive', (req, res) => {

    connection.aggregate([
        {
            $group: {
              _id: "total", 
              totalInf: { $sum: "$infected" }, // sum of inf. people
              totalRec: { $sum: "$recovered"}  // sum of rec. people
            },
          }
    ])
    .then(result => {
        console.log(result);  let ans = result[0];
        res.json({data : {_id : ans._id, active : ans.totalInf - ans.totalRec}})
    })
    .catch(err => {
        console.log("aggregation failed !");
        res.json({message : "Couldnt get the data."})
    })
});


// TO FIND ALL THE D CASES
app.get('/totalDeath', (req, res) => {

    connection.aggregate([
        {
            $group: {
              _id: "total", 
              death: { $sum: "$death" }
            }
        }
    ])
    .then(result => {
        console.log(result);  let ans = result[0];
        res.json({data : result})
    })
    .catch(err => {
        console.log("aggregation failed !");
        res.json({message : "Couldnt get the data."})
    })
});



// TO FIND ALL THE H STATES
app.get('/hotspotStates', (req, res) => {

    connection.aggregate([
        {
          $addFields: {
            rate: {
              $round: [
                {
                  $divide: [
                    { $subtract: ["$infected", "$recovered"] }, // Calculate (infected - recovered)
                    "$infected" // Divide by infected
                  ]
                },
                5 // Round to 5 decimal places
              ]
            }
          }
        },
        {
          $match: {
            rate: { $gt: 0.1 } 
          }
        },
        {
          $project: {
            _id: 0, // Exclude the _id field
            state: 1, // Include the state field
            rate: 1 // Include the rate field
          }
        }
      ])
    .then(result => {
        console.log(result); 
        res.json({data : result})
    })
    .catch(err => {
        console.log("aggregation failed !");
        res.json({message : "Couldnt get the data."})
    })
});



// TO FIND ALL THE HEALTHY STATES
app.get('/healthyStates', (req, res) => {

    connection.aggregate([
        {
            $addFields: {
                mortality: {
                    $round: [
                        {
                            $divide : ["$death", "$infected"]      // first pipeline will provide the m value
                        },
                        5
                    ]
                }
            }
        },

        {
            $match: {
                mortality: {$lt: 0.005}     // checks if it is below a certain range
            }
        },
        {
            $project: {         // Decides which properties we want to display
                _id : 0,
                state: 1,
                mortality: 1
            }
        }
    ])
    .then(result => {
        console.log(result);  
        res.json({data : result})
    })
    .catch(err => {
        console.log("aggregation failed !");
        res.json({message : "Couldnt get the data."})
    })
});

app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;