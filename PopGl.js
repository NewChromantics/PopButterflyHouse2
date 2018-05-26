function GetRed(Colour)
{
	let Value = parseInt( Colour.substring(0,2), 16);
	return Value / 255;
}

function GetGreen(Colour)
{
	let Value = parseInt( Colour.substring(2,4), 16);
	return Value / 255;
}

function GetBlue(Colour)
{
	let Value = parseInt( Colour.substring(4,6), 16);
	return Value / 255;
}


//	namespace
var PopGl =
{
	GetTypeAndSize : function(Type)
	{
		if ( typeof Type == "number" )	return { Type:gl.FLOAT, Size:1 };
		if ( Type instanceof float2 ) return { Type:gl.FLOAT, Size:2 };
		if ( Type instanceof float3 ) return { Type:gl.FLOAT, Size:3 };
		if ( Type instanceof float4 ) return { Type:gl.FLOAT, Size:4 };
		throw "Unhandled type " + Typename;
	}
};

//	global that needs some refactor
var gl = null;


function TContext(CanvasElement)
{
	this.Context = null;
	this.Canvas = CanvasElement;
	
	this.Context = CanvasElement.getContext("webgl");
	if ( !this.Context )
		throw "Failed to initialise webgl";

	
	//	setup global var
	gl = this.Context;
}


// Create a GLSL shader program given:
// - a WebGL context,
// - a string for the vertex shader, and
// - a string for the fragment shader.
function buildShaderProgram(vertShaderSrc, fragShaderSrc)
{
	function buildShader(type, source)
	{
		var sh;
		if (type == "fragment")
			sh = gl.createShader(gl.FRAGMENT_SHADER);
		else if (type == "vertex")
			sh = gl.createShader(gl.VERTEX_SHADER);
		else // Unknown shader type
			return null;
		gl.shaderSource(sh, source);
		gl.compileShader(sh);
		// See if it compiled successfully
		if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
			console.log("An error occurred compiling the " + type +
			" shader: " + gl.getShaderInfoLog(sh));
			return null;
		} else { return sh; }
	};
	
	var prog = gl.createProgram();
	gl.attachShader(prog, buildShader('vertex', vertShaderSrc));
	gl.attachShader(prog, buildShader('fragment', fragShaderSrc));
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		throw "Could not link the shader program!";
	}
	return prog;
}


//	let hello = new float2(0,0)
function float2(x,y)
{
	this.x = x;
	this.y = y;
}

//	let hello = new float3(0,0,0)
function float3(x,y,z)
{
	this.x = x;
	this.y = y;
	this.z = z;
}

function float4(x,y,z,w)
{
	this.x = x;
	this.y = y;
	this.z = z;
	this.w = w;
}


	function TAttribute(Uniform,Buffer)
	{
		this.Uniform = Uniform;
		
		let TypeAndSize = PopGl.GetTypeAndSize(Buffer[0]);
		this.Type = TypeAndSize.Type;
		this.Size = TypeAndSize.Size;
		this.Stride = 0;
		this.Data = Buffer;
		
		this.EnumVertexData = function(EnumFloat)
		{
			let EnumFloats = function(Element)
			{
				if ( typeof Element == "number" )	{	EnumFloat(Element);	}
				else if ( Element instanceof float2 )	{	EnumFloat(Element.x);	EnumFloat(Element.y);	}
				else if ( Element instanceof float3 )	{	EnumFloat(Element.x);	EnumFloat(Element.y);	EnumFloat(Element.z);	}
				else if ( Element instanceof float4 )	{	EnumFloat(Element.x);	EnumFloat(Element.y);	EnumFloat(Element.z);	EnumFloat(Element.w);	}
				else throw "Unhandled type " + typeof Element;
			}
			this.Data.forEach( EnumFloats );
		}
	}

	function TGeometry(Name)
	{
		this.Name = Name;
		this.Attributes = [];
		this.Buffer = null;		//	gl vertex buffer
		
		this.bind = function()
		{
			throw "todo";
		}
		
		this.AddAttribute = function(Attribute)
		{
			//this.Attributes[Attribute.Uniform] = Attribute;
			this.Attributes[0] = Attribute;
		}
		
		this.CreateBuffer = function()
		{
		}
		
		this.GetVertexData = function()
		{
			let Floats = [];
			let EnumFloat = function(Float)
			{
				Floats.push( Float );
			};
			let EnumFloats = function(Attrib)
			{
				Attrib.EnumVertexData( EnumFloat );
			};
			this.Attributes.forEach( EnumFloats );
			return new Float32Array( Floats );
		}
	}

    function TTexture(Name,Url)
    {
        this.Name = Name;
        this.Asset = null;
        
        this.CreateAsset = function()
        {
            this.Asset = gl.createTexture();
            this.WritePixels( 1, 1, [255, 0, 255, 255] );
        }
        
        this.WritePixels = function(Width,Height,Pixels)
        {
            gl.bindTexture(gl.TEXTURE_2D, this.Asset );
            const level = 0;
            const internalFormat = gl.RGBA;
            const srcFormat = gl.RGBA;
            const srcType = gl.UNSIGNED_BYTE;
            
            if ( Pixels instanceof Image )
            {
                gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,	srcFormat, srcType, Pixels);
            }
            else
            {
                //  if Pixels is array
                const border = 0;
                const PixelData = new Uint8Array(Pixels);
                gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, Width, Height, border, srcFormat, srcType, PixelData);
            }

            // WebGL1 has different requirements for power of 2 images
            // vs non power of 2 images so check if the image is a
            // power of 2 in both dimensions.
            // No, it's not a power of 2. Turn of mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        
        this.Load = function(Url)
        {
            const image = new Image();
            image.crossOrigin = "anonymous";
            let This = this;
            image.onload = function()
            {
                This.WritePixels( 0, 0, image );
            };
            //  trigger load
            image.src = Url;
        }
        
        
        //  auto init
        this.CreateAsset();
        
        if ( Url !== undefined )
            this.Load( Url );
    }

    function TScreen(CanvasElement)
    {
        this.CanvasElement = CanvasElement;
        
        this.GetWidth = function()
        {
            return this.CanvasElement.width;
        }
        
        this.GetHeight = function()
        {
            return this.CanvasElement.height;
        }
        
        //  unbind any frame buffer
        this.Bind = function()
        {
            gl.bindFramebuffer( gl.FRAMEBUFFER, null );
            gl.viewport(0, 0, this.GetWidth(), this.GetHeight() );
        }
    }

    function TRenderTarget(Name,Texture)
    {
        this.Name = Name;
        this.FrameBuffer = null;
        this.Texture = null;
        
        this.CreateFrameBuffer = function(Texture)
        {
            this.FrameBuffer = gl.createFrameBuffer();
            this.Texture = Texture;
            
            this.Bind();
            
            //  attach this texture to colour output
            const attachmentPoint = gl.COLOR_ATTACHMENT0;
            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, this.Texture.Asset, level);
        }
        
        //  bind for rendering
        this.Bind = function()
        {
            gl.bindFramebuffer( gl.FRAMEBUFFER, this.FrameBuffer );
            gl.viewport(0, 0, this.GetWidth(), this.GetHeight() );
        }
        
        this.GetWidth = function()
        {
            return this.Texture.GetWidth();
        }
        
        this.GetHeight = function()
        {
            return this.Texture.GetHeight();
        }
        
        if ( Texture !== undefined )
            this.CreateFrameBuffer( Texture );
    }

    function BindTexture(Texture,Program,Uniform,TextureIndex)
    {
        let UniformPtr = gl.getUniformLocation(Program, Uniform);
        //  https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
        //  WebGL provides a minimum of 8 texture units;
        let GlTextureNames = [ gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2, gl.TEXTURE3, gl.TEXTURE4, gl.TEXTURE5, gl.TEXTURE6, gl.TEXTURE7 ];

        //	setup textures
        gl.activeTexture( GlTextureNames[TextureIndex] );
        try
        {
            gl.bindTexture(gl.TEXTURE_2D, Texture.Asset);
        }
        catch
        {
            //  todo: bind "invalid" texture
        }
        gl.uniform1i(UniformPtr, TextureIndex );
    }

