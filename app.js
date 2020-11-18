//jsint esversion: 6

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const app = express();

app.use(express.static("public"))
app.use(bodyParser.urlencoded ({ extended: true}))
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/toDoListDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);

const itemSchema = new mongoose.Schema({
    name: {
        required: true,
        type: String
    }
});

const Item = mongoose.model('Item', itemSchema);

let items = []
const item1 = new Item ({
    name: "Welcome to your To do List!"
})
const item2 = new Item ({
    name: "Hit the + button to add a new item"
})
const item3 = new Item ({
    name: "<-- Hit this to delete an item"
})

const defaultItemArr = [item1,item2,item3];

const listSchema = {
    name: String,
    items: [itemSchema]
}

const List = mongoose.model("List", listSchema);


app.get('/', function(req, res) {

    Item.find({}, function(err, items) {
        if(items.length === 0){
            Item.insertMany(defaultItemArr, function(err){
                if(err){
                    console.log(err);
                } else {
                    console.log("Successfully added items")
                }
            });
            res.redirect('/');
        } else {
        res.render("list", {listTitle: "Today", newListItems: items})
        }
    })
})

app.post('/', function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item ({
        name: itemName
    });

    if(listName === "Today") {
        item.save();
        res.redirect('/')
    } else {
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }

})

app.post('/delete', function(req,res){
    let deleteItemID = req.body.checkBox;
    let listName = req.body.listName;

    if(listName === "Today") {
    Item.findByIdAndDelete(deleteItemID, function (err) {
        if(err) console.log(err);
        console.log("Successful deletion");
    });
    res.redirect('/');
    } else {
        List.findOneAndUpdate({name: listName},{$pull: {items: {_id: deleteItemID}}}, function(err, foundList){
            console.log("T")
            if(!err){
                res.redirect("/" + listName);
            }
        })
    }
})

app.get('/:customListName', function(req,res){
    const customListName = req.params.customListName;
    
    List.findOne({name: customListName}, function(err,foundList){
        if(!err){
            if(foundList){
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
            } else {
                const list = new List ({
                    name: customListName,
                    items: defaultItemArr
                });
                list.save();
                res.redirect('/' + customListName);
            }
        }
    });
})

app.listen(3000, function() {
    console.log("Server started on port 3000")
})