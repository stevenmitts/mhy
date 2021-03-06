import path from 'path'
import Process from '@/processes'
import copyDir from 'copy-dir'

const getCmdBabelCLI = (flags = []) => [
    'node',
    require.resolve('@babel/cli/bin/babel.js'),
    path.resolve(process.cwd(), 'src'),
    '--out-dir',
    'dist',
    '--config-file',
    require.resolve('@/configs/babel'),
    '--ignore',
    ['node_modules', 'test', 'tests', 'dist', 'temp', 'build', 'tmp', '**/*.d.ts'].join(','),
    '--delete-dir-on-start',
    '--extensions',
    '.js,.jsx,.ts,.tsx',
    ...flags
]

class Babel extends Process {
    constructor(args) {
        const { props: { defaultAction = 'start' } = {}, ...rest } = args
        super(args)
        this.run(defaultAction, { ...rest })
    }

    onStart = ({ name }, { flags }) => {
        this.spawn(name, getCmdBabelCLI(flags), 'pipe')
        this.on('data', handleCompileSuccess)
    }

    actions = [
        {
            name: 'start',
            enabled: true,
            onRun: this.onStart
        }
    ]
}

const handleCompileSuccess = line => {
    if (!line.includes('Successfully')) return

    copyDir.sync(path.resolve(process.cwd(), 'src'), path.resolve(process.cwd(), 'dist'), function(
        stat,
        filepath,
        filename
    ) {
        if (stat === 'file') {
            if (filename.endsWith('.d.ts')) {
                return true
            }
            if (
                filename.endsWith('ts') ||
                filename.endsWith('tsx') ||
                filename.endsWith('js') ||
                filename.endsWith('jsx')
            ) {
                return false
            }
            return true
        }
        return true
    })
}

const getBabel = () => Babel
export default getBabel
