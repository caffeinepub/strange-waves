import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';

/**
 * Extended hook that provides actor readiness state
 * Wraps the auto-generated useActor hook with additional state tracking
 */
export function useActorReady() {
    const { actor, isFetching } = useActor();
    const { isInitializing } = useInternetIdentity();
    
    const isActorReady = !!actor && !isFetching;
    const isActorInitializing = isFetching || isInitializing;

    // Log actor status for debugging
    if (isActorReady && !isFetching) {
        console.log('[ActorReady] Actor is ready');
    } else if (isActorInitializing) {
        console.log('[ActorReady] Actor is initializing...');
    }

    return {
        actor,
        isFetching,
        isActorReady,
        isActorInitializing,
        actorError: null, // The base useActor doesn't expose errors, so we return null
    };
}
