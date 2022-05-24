# spectrum-analyzer
Statistical Tools for Spectrum Shape Analysis

## How to install

First install [node js](https://nodejs.org/en/download/) and [git](https://git-scm.com/downloads) for your OS

Clone this repo

```sh

git clone https://github.com/Stethophone/spectrum-analyzer.git

```

Change dir

```sh

cd spectrum-analyzer

```

Install dependencies

```sh

npm install

```


Now analyzer is ready to use

## Spectrum set precision analysis

Normalizes the shapes of the spectrum, calculates the shape of the centroid and the distance between it and the shapes of the spectrum

```sh

npm run precision <path-to-config-file>

```

For example

```sh

npm run precision ./config/precision/example.yaml

```

### Settings of spectrum class precision analysis (./config/precision/example.yaml)

```yaml
# settings of spectrum class precision analysis 

# array of path to spectrum set folder "./data/input/example" as example
input: 
  - ./data/input/example/set A/
  - ./data/input/example/set B/

# array of path to result xlsx file
output: 
  - ./data/result/example/precision-set-A.xlsx
  - ./data/result/example/precision-set-B.xlsx  

parameters:

  # default file name of spectrum set data
  # should be xlsm format file
  #
  # FILE FORMAT
  #
  # should have "Sheet1" sheet with data
  # first row - header "Model, File, 0, ..., 2000"
  # each next row = spectrum data 
  
  defaultfilename: spectrum.xlsm  
  
  # frequency range settings [0, 2000] as default
  frequency: 
    range:
      - 0
      - 2000
```      


## Spectrum class separability analysis

Calculates distances between class centroids and evaluates class intersections

```sh

npm run separability <path-to-config-file>

```

For example

```sh

npm run separability ./config/separability/example.yaml

```

### Class separability analysis settings (./config/separability/example.yaml)

```yaml

# class separability analysis settings 

# path to spectrum sets folder "./data/input/example" as example
input: ./data/input/example/ 

# path to result xlsx file
output: ./data/result/example/separability-setA-setB.xlsx  

parameters:

  # default file name of spectrum set data
  # should be xlsm format file
  # should have "Sheet1" sheet with data
  # 1 row - header "Model, File, 0, ..., 2000"
  # each next row = spectrum data 
  
  defaultfilename: spectrum.xlsm  
  
  # frequency range settings [0, 2000] as default
  frequency: 
    range:
      - 0 
      - 2000

```

*** happy usage! ***