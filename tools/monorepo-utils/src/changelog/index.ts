/**
 * External dependencies
 */
import { Command } from '@commander-js/extra-typings';
import simpleGit from 'simple-git';
import { execSync } from 'child_process';

/**
 * Internal dependencies
 */
import { Logger } from '../core/logger';
import { cloneAuthenticatedRepo, checkoutRemoteBranch } from '../core/git';
import { getPRDescription } from './lib';

const changeLogHelper = new Command( 'changelog' )
	.option(
		'-o --owner <owner>',
		'Repository owner. Default: woocommerce',
		'woocommerce'
	)
	.option(
		'-n --name <name>',
		'Repository name. Default: woocommerce',
		'woocommerce'
	)
	.option(
		'-d --dev-repo-path <devRepoPath>',
		'Path to existing repo. Use this option to avoid cloning a fresh repo for development purposes. Note that using this option assumes dependencies are already installed.'
	)
	.action(
		async ( options: {
			owner: string;
			name: string;
			devRepoPath?: string;
		} ) => {
			const { name, devRepoPath } = options;
			const prNumber = '38267';
			const branch = 'test/change';
			const fileName = branch.replace( '/', '-' ) + '2';
			const project = 'woocommerce';
			const message = `Add test changelog for PR #${ prNumber }. This is generated using an action`;
			const significance = 'patch';
			const type = 'fix';
			const contributor = 'psealock';

			const prData = await getPRDescription( options, prNumber );
			const { body } = prData;

			Logger.notice( JSON.stringify( body, null, 2 ) );

			const cmd = `pnpm --filter=${ project } run changelog add -f ${ fileName } -s ${ significance } -t ${ type } -e "${ message }" -n`;

			Logger.startTask(
				`Making a temporary clone of '${ contributor }/${ name }'`
			);
			const tmpRepoPath = devRepoPath
				? devRepoPath
				: await cloneAuthenticatedRepo(
						{ owner: contributor, name },
						true
				  );

			Logger.endTask();

			Logger.notice(
				`Temporary clone of '${ contributor }/${ name }' created at ${ tmpRepoPath }`
			);

			Logger.notice( `Checking out branch ${ branch }` );
			await checkoutRemoteBranch( tmpRepoPath, branch );

			// When a devRepoPath is provided, assume that the dependencies are already installed.
			if ( ! devRepoPath ) {
				Logger.notice( `Installing dependencies in ${ tmpRepoPath }` );
				execSync( `pnpm install --filter ${ project }`, {
					cwd: tmpRepoPath,
					stdio: 'inherit',
				} );
			}

			Logger.notice( `Running changelog command` );
			execSync( cmd, { cwd: tmpRepoPath } );

			const git = simpleGit( {
				baseDir: tmpRepoPath,
				config: [ 'core.hooksPath=/dev/null' ],
			} );
			await git.raw(
				'config',
				'--global',
				'user.email',
				'github-actions@github.com'
			);
			await git.raw(
				'config',
				'--global',
				'user.name',
				'github-actions'
			);
			Logger.notice( `Adding and committing changes` );
			await git.add( '.' );
			await git.commit( `Adding changelog` );
			await git.push( 'origin', branch );

			Logger.notice( `Pushed changes to ${ branch }` );
		}
	);

export default changeLogHelper;