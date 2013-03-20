(function() {
  var fs = require('fs'), 
      path = require('path'),
      BrushManager;

      BASE = path.resolve(path.join(path.dirname(__filename), '..')),
      SHJS = path.resolve(path.join(BASE, 'lib', 'SyntaxHighlighter', 'scripts'));
      CHJS = path.resolve(path.join(BASE, 'lib', 'js'));

  // Load the XRegExp file into scope
  global.XRegExp = require(path.join(CHJS, 'XRegExp.node.js')).XRegExp;

  // Load the SyntaxHighlighter package core class into the
  // global scope
  global.SyntaxHighlighter = require(path.join(SHJS, 'shCore.js'))
      .SyntaxHighlighter;

  /**
   * Loaded brush repository
   */
  exports.BrushManager = BrushManager = {
    /** Default Syntax Highlighting script directory */
    SHJS_DIR: SHJS,

    /** Dictionary of Brush classes to instantiate. */
    brushes: {},

    /** Brush count; number of brushes loaded. */
    brushCount: 0,

    /**
     * Method used to load all the brush files from the specified brushDir
     * or, by default, the SyntaxHighlighter scripts directory. This method
     * can be called subsequent times to append more and more highlighters
     * from more than on directory. Note that conflicting aliases for a 
     * given brushes on subsequent loads from more than one directory may
     * result in conflicting Brushes for seemingly same types. 
     * 
     * @param brushDir absolute path to directory from which to load the
     *     brushes for later use.
     * @return returns the BrushManager to allow for chain loading
     */
    loadBrushes: function(brushDir) {      
      brushDir = brushDir || this.SHJS_DIR;

      var files = fs.readdirSync(brushDir),
          self = this;

      files.forEach(function(fileName, index, array) {
        if (/shBrush.*\.js/i.exec(fileName)) {
          Brush = require(path.join(brushDir, fileName)).Brush;
          Brush.aliases.forEach(function(alias, index, array) {
            if (!self.brushes[alias.toLowerCase()]) {
              self.brushCount++;
            }
            self.brushes[alias.toLowerCase()] = Brush;
          });
        }
      });

      return this;
    },

    /**
     * Attempts to fetch one a loaded brush that matches the supplied
     * alias. If there are no loaded brushes an obligatory call to
     * loadBrushes will be made each time this method is called until
     * at least one brush is loaded.
     *
     * @param alias a case insenstive alias name that applies to the
     *     brush in question
     * @param brushesDir by default it will use the SHJS_DIR constant
     *     which reflects Alex's Syntax Highlighter scripts
     */
    getBrush: function(alias, brushesDir) {
      var Brush, brush = null;

      if (alias) {
        if (this.brushCount === 0) {
          this.loadBrushes(brushesDir);
        }

        Brush = this.brushes[alias.toLowerCase()];
        if (Brush) {
          brush = new Brush();
        }
      }

      return brush;
    },

    /**
     * Return an array of loaded brushes by alias name. The array
     * can be string converted by simply calling join() on the resulting
     * array. 
     * 
     * @return an array of brush aliases. If there are no loaded brushes
     *      an attempt to load them will be made first.
     */
    getKnownTypes: function() {
      var types = [], key;

      if (this.brushCount === 0) {
        this.loadBrushes();
      }

      for (key in this.brushes) {
        if (this.brushes.hasOwnProperty(key)) {
          types.push(key);
        }
      }

      return types;
    }
  };

  /**
   * Invokes Alex Gorbatchev's Syntax Highlighter on the given code. The type
   * of hightlighter brush to use is supplied by the invoker and is required.
   * Since there is no file from which to derive an appropriate brush one must
   * be supplied. The supplied value is compared to the loaded aliases of all
   * the known brushes. If there is a match, that brush is used. If no match
   * is found, the plain brush is used.
   *
   * @param code the text containing the code to highlight
   * @param type one the aliases of the brush to use
   * @param options any of the valid param types that can be supplied to
   *     Alex's Syntax Highlighter
   * @return highlighted code or the passed in code if no brush could be found.
   */
  exports.highlight = function(code, type, options) {
    var brush = BrushManager.getBrush(type), result = code || "";
    if (brush) {
      result = brush.process(code, options);      
    }
    return result.trim();
  };
})();

