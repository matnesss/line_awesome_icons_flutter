const fs = require('fs')
const util = require('util');
const isVarName = require('is-var-name');

// Convert fs.readFile into Promise version of same    
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const libraryDirectory = 'library';
var parseString = require('xml2js').parseString;

// Maps font name with class name
const fontList = {
    'la-regular-400': "IconDataBrands",
    'la-brands-400': "IconDataRegular",
    'la-solid-900': "IconDataSolid",
}


const GetDartCode = async () => {
    let fileOutput = "import 'package:flutter/widgets.dart';\n";
    let staticMappingOutput = 'class LineAwesomeIcons {\n';
    let addedGlyphs = [];

    const scssVariables = await readFile(libraryDirectory + '/scss/_variables.scss', 'utf8');

    for (var fontName in fontList){
        const className = fontList[fontName];

        fileOutput += `
class `+className+` extends IconData {
    const `+className+`(int codePoint)
        : super(codePoint,
            fontFamily: '`+fontName+`', fontPackage: 'line_awesome_icons');
}
`;

        const data = await readFile(libraryDirectory + '/fonts/'+ fontName + '.svg', 'utf8');
        const parsedData = await promiseParser(data);
        
        var glyphList = parsedData['svg']['defs'][0]['font'][0]['glyph'];

        staticMappingOutput += '\n    // ' + fontName + '.ttf\n';
        for (var i in glyphList){
            var unicodeChar = glyphList[i]['$']['unicode'];
            var unicodeString = unicodeChar.codePointAt(0).toString(16);

            // Get all lines that contains the unicode code.
            var result = scssVariables.split('\n')
            .filter(line => line.includes(unicodeString))

            // Assume first line is ok
            if (result.length >= 1){
                const lineSelected = result[0];
                let cssKey = lineSelected.split(":")[0].replace("$","").replace("la-","");
                if (!addedGlyphs.includes(cssKey)){
                    if (!isVarName(cssKey)){
                        cssKey = 'la_' + cssKey;
                        if (!isVarName(cssKey)) continue;
                    }
                    staticMappingOutput += '    static const IconData ' + cleanGlyphName(cssKey) + ' = const ' + className + '(0x' + unicodeString + ');\n';
                    addedGlyphs.push(cssKey);
                }
            }
        }
    }
    staticMappingOutput += '}';

    await writeFile("../lib/line_awesome_icons.dart", fileOutput + '\n' + staticMappingOutput);    
}



const promiseParser = (string) => {
    return new Promise(function(resolve, reject)
    {
        parseString(string, function(err, result){
            if(err){
                reject(err);
            }
            else {
                resolve(result);
            }
        });
    });
}

const cleanGlyphName = (glyphName)=>{
    glyphName = glyphName.replace(/-/g,"_",true);
    glyphName = glyphName.replace(/__/g,"_",true);
    return glyphName;
}

GetDartCode();
