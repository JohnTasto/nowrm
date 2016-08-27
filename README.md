# Automate removal of now deployments.

Usage: `notnow [options]`

#### Options:
| | |
|-|-|
|`-h, --help`                    | output usage information                                 |
|`-V, --version`                 | output the version number                                |
|`-y, --yes`                     | automatically confirm removal                            |
|`-o, --old`                     | keep the most recent deployment                          |
|`-k, --keep <hashes>`           | comma separated list of deployments to keep              |
|`-v, --verbose`                 | show additional output                                   |

#### Examples:

- Prompt for each deployment individually:  
`$ notnow`

- Remove all deployments:  
`$ notnow --yes`

- Remove all deployments except those specified:  
`$ notnow --yes --keep <hash1>,<hash2>`
