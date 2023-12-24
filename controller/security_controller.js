const helper = require("../helpers")
const securityHandler = require("../handler/security_handler")
const axios = require("axios")
const cheerio = require("cheerio")



// "/login/category"?category=private&appName=GC2
const login = (req, res) => {
    const { countryCode, phone, password } = req.body;
    let countryDetails = helper.countryCodeISD(countryCode)
    if (countryDetails) {
        if (helper.validate_phone_number(countryCode, phone)) {
            securityHandler.login(countryDetails, phone, password, res)
        } else {
            return res.status(400).send(
                {
                    "errors": "Enter Valid Phone Number",
                    "status": 400 
                }
            )
        }
    } else {
        return res.status(400).send(
            {
                "errors": "Select Valid Country Code",
                "status": 400 
            }
        )
    }
}

const getImages = async (req, res) => {
    let url = "https://photos.app.goo.gl/"
    album_id = req.params.images_id
    // console.log(album_id);
    try {
     
      // Make an HTTP request to the URL
      const response = await axios.get(url+album_id);
  
      // Load the HTML content into Cheerio
      const $ = cheerio.load(response.data);
  
      // Initialize variables to store the highest width and height
      let maxWidth = 0;
      let maxHeight = 0;
  
      // Extract image URLs and dimensions
      const images = [];
      $('img').each((index, element) => {
        let imageUrl = $(element).attr('src');
        const width = parseInt($(element).attr('width')) || 0;
        const height = parseInt($(element).attr('height')) || 0;
  
        // Check if the current image has higher dimensions
        if (width > maxWidth) {
          maxWidth = width;
          maxHeight = height;
        }
  
        // Remove dimensions and add w=1020
        imageUrl = imageUrl.replace(/=w\d+-h\d+-no$/, '=w1020');
  
        images.push({ imageUrl});
      });
      res.status(200).send(images)
      // Output highest width and height
      // console.log('Highest Width:', maxWidth);
      // console.log('Highest Height:', maxHeight);
  
      // Output all image URLs with dimensions
      // console.log('Image URLs with Dimensions:', images);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }


module.exports = {login, getImages}