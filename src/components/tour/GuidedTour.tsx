
'use client';
import React, { useState, useEffect, useRef, useCallback, ReactNode, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { X, ArrowLeft, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourStepDefinition, GuidedTourProps } from '@/types';

// Configuration Constants
const HIGHLIGHT_PADDING = 5;
const INITIAL_DOM_FIND_RETRY_DELAY_MS_SIMPLE = 300;
const MAX_INITIAL_DOM_FIND_ATTEMPTS_SIMPLE = 10; // Increased attempts

const POST_ACTION_SETTLE_DELAY_MS_SIMPLE = 800;
const SCROLL_COMPLETION_DELAY_MS = 100; // Using 'auto' scroll behavior, this can be shorter
const DEFAULT_VERTICAL_OFFSET = -22.0; 


const isElementVisibleAndSized = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0.1 && element.offsetParent !== null && rect.width > 1 && rect.height > 1;
};

type RectObject = {
    top: number; bottom: number; left: number; right: number;
    width: number; height: number; x: number; y: number;
};

export default function GuidedTour({ steps, isOpen, onClose, tourKey }: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<RectObject | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [elementNotFound, setElementNotFound] = useState(false);
  
  const [isProcessingStepAction, setIsProcessingStepAction] = useState(false);
  const [isFindingElement, setIsFindingElement] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isHighlightVisible, setIsHighlightVisible] = useState(false);

  const tourContainerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const processingStepRef = useRef(false);
  const directionRef = useRef<'next' | 'prev'>('next');

  const currentStep = useMemo(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
      return steps[currentStepIndex];
    }
    return null;
  }, [steps, currentStepIndex]);

  useEffect(() => {
    if (isOpen) {
      console.log(`[TourDebug] Tour opened or key changed. Resetting to step 0. Key: ${tourKey}`);
      setCurrentStepIndex(0);
      setIsPopupVisible(false);
      setIsHighlightVisible(false);
      setTargetRect(null);
      setElementNotFound(false);
      setIsProcessingStepAction(false);
      setIsFindingElement(false);
      processingStepRef.current = false;
      directionRef.current = 'next';
    }
  }, [isOpen, tourKey]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleNext = useCallback(() => {
    if (processingStepRef.current) return;
    directionRef.current = 'next';
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose();
    }
  }, [processingStepRef, currentStepIndex, steps.length, onClose]);

  const handlePrev = useCallback(() => {
    if (processingStepRef.current) return;
    directionRef.current = 'prev';
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1); 
    }
  }, [processingStepRef, currentStepIndex]);

  const handleSkip = useCallback(() => {
    if (processingStepRef.current) return;
    onClose();
  }, [onClose, processingStepRef]);

  const revealElementAndGetRect = useCallback(async (
    selector: string,
    domFindAttempt = 0,
  ): Promise<DOMRect | null> => {
    console.log(`[TourDebug] revealElementAndGetRect: Selector: "${selector}", DOMFindAttempt: ${domFindAttempt + 1}/${MAX_INITIAL_DOM_FIND_ATTEMPTS_SIMPLE}`);
    await new Promise(r => requestAnimationFrame(r));
    let targetElement = document.querySelector(selector) as HTMLElement | null;

    if (!targetElement && domFindAttempt < MAX_INITIAL_DOM_FIND_ATTEMPTS_SIMPLE) {
      await new Promise(resolve => setTimeout(resolve, INITIAL_DOM_FIND_RETRY_DELAY_MS_SIMPLE));
      return revealElementAndGetRect(selector, domFindAttempt + 1);
    }

    if (!targetElement) {
      console.warn(`[TourDebug] Element "${selector}" NOT FOUND in DOM after ${MAX_INITIAL_DOM_FIND_ATTEMPTS_SIMPLE} attempts.`);
      return null;
    }
    
    // Changed behavior to 'auto' for more reliable scrolling on complex pages
    targetElement.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
    await new Promise(resolve => setTimeout(resolve, SCROLL_COMPLETION_DELAY_MS)); 
    
    return isElementVisibleAndSized(targetElement) ? targetElement.getBoundingClientRect() : null;
  }, []);

  useEffect(() => {
    if (!isOpen || !currentStep || processingStepRef.current) {
      if(!isOpen || !currentStep) {
        setIsPopupVisible(false);
        setIsHighlightVisible(false);
        setTargetRect(null);
        setElementNotFound(false);
        setIsProcessingStepAction(false);
        setIsFindingElement(false);
      }
      return;
    }

    processingStepRef.current = true;

    const processStepAsync = async () => {
      console.log(`[TourDebug] Processing Step ${currentStepIndex + 1}: "${currentStep.title}"`);
      setIsPopupVisible(false); 
      setIsHighlightVisible(false); 
      setTargetRect(null);
      setElementNotFound(false);
      let localTargetRect: DOMRect | null = null;

      if (currentStep.action) {
        setIsProcessingStepAction(true);
        console.log(`[TourDebug] Performing ACTION for step "${currentStep.title}"`);
        try {
          await currentStep.action();
          await new Promise(resolve => setTimeout(resolve, POST_ACTION_SETTLE_DELAY_MS_SIMPLE));
        } catch (error) {
          console.error(`[TourDebug] Error during action for step "${currentStep.title}":`, error);
          setElementNotFound(true); 
        }
        setIsProcessingStepAction(false);

        if (currentStep.isModal && !currentStep.content && directionRef.current === 'next') {
          console.log(`[TourDebug] Modal action step "${currentStep.title}" (no content) done, auto-advancing.`);
          processingStepRef.current = false;
          handleNext();
          return; 
        }
      }

      if (currentStep.selector) {
        setIsFindingElement(true);
        console.log(`[TourDebug] Finding element for selector: "${currentStep.selector}"`);
        localTargetRect = await revealElementAndGetRect(currentStep.selector);
        setIsFindingElement(false);
        
        if (localTargetRect) {
            const verticalOffset = currentStep.verticalOffset ?? DEFAULT_VERTICAL_OFFSET;
            // Create a plain object from the DOMRect that we can modify
            const rectObject: RectObject = {
              top: localTargetRect.top,
              bottom: localTargetRect.bottom,
              left: localTargetRect.left,
              right: localTargetRect.right,
              width: localTargetRect.width,
              height: localTargetRect.height,
              x: localTargetRect.x,
              y: localTargetRect.y,
            };

            // Apply the offset
            rectObject.top += verticalOffset;
            rectObject.y += verticalOffset;
            rectObject.bottom += verticalOffset;
            
            setTargetRect(rectObject);
            setIsHighlightVisible(true);
            setElementNotFound(false);
        } else {
            setTargetRect(null);
            setIsHighlightVisible(false);
            setElementNotFound(true);
        }
      } else if (currentStep.isModal) {
        setTargetRect(null);
        setIsHighlightVisible(false);
        setElementNotFound(false);
      } else {
        setTargetRect(null);
        setIsHighlightVisible(false);
        setElementNotFound(true);
        console.warn(`[TourDebug] Step "${currentStep.title}" has no selector and is not a modal.`);
      }
      
      processingStepRef.current = false;
    };

    processStepAsync();
  }, [isOpen, currentStep, tourKey, revealElementAndGetRect, handleNext]);


  const calculatePopupPosition = useCallback((
    step: TourStepDefinition,
    rect: RectObject | null,
    isNotFound: boolean,
    popupW: number,
    popupH: number
  ) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const space = 10; 

    if (isNotFound || step.isModal || !rect) {
      return {
        top: Math.max(space, vh / 2 - popupH / 2),
        left: Math.max(space, vw / 2 - popupW / 2)
      };
    }

    let finalTop = 0, finalLeft = 0;
    const preferredPlacement = step.placement || 'bottom';
    
    if (preferredPlacement === 'bottom' && rect.bottom + popupH + space < vh) {
      finalTop = rect.bottom + space;
    } else if (preferredPlacement === 'top' && rect.top - popupH - space > 0) {
      finalTop = rect.top - popupH - space;
    } else if (preferredPlacement === 'right' && rect.right + popupW + space < vw) {
      finalTop = rect.top + rect.height / 2 - popupH / 2;
      finalLeft = rect.right + space;
    } else if (preferredPlacement === 'left' && rect.left - popupW - space > 0) {
      finalTop = rect.top + rect.height / 2 - popupH / 2;
      finalLeft = rect.left - popupW - space;
    } else { // Fallback logic
      if (rect.bottom + popupH + space < vh) { 
        finalTop = rect.bottom + space;
      } else if (rect.top - popupH - space > 0) { 
        finalTop = rect.top - popupH - space;
      } else { // center vertically if no space top/bottom
        finalTop = Math.max(space, vh / 2 - popupH / 2);
      }
    }
    
    if (preferredPlacement === 'top' || preferredPlacement === 'bottom' || (finalLeft === 0 && (preferredPlacement !== 'left' && preferredPlacement !== 'right'))) {
        finalLeft = rect.left + rect.width / 2 - popupW / 2;
    }

    finalLeft = Math.max(space, Math.min(finalLeft, vw - popupW - space));
    finalTop = Math.max(space, Math.min(finalTop, vh - popupH - space));

    return { top: finalTop, left: finalLeft };
  }, []);

  useEffect(() => {
    if (!isOpen || !currentStep || processingStepRef.current || isProcessingStepAction || isFindingElement) {
      if (isPopupVisible) setIsPopupVisible(false);
      return;
    }
    
    const shouldAttemptPopupRender = 
        (targetRect && isHighlightVisible && !elementNotFound) || 
        (elementNotFound && currentStep.selector) || 
        (currentStep.isModal && !currentStep.selector);

    if (shouldAttemptPopupRender) {
      if (popupRef.current) {
        const popupEl = popupRef.current;
        let popupHeight = popupEl.offsetHeight;
        let popupWidth = popupEl.offsetWidth;

        const positionAndShow = () => {
          // The targetRect in state is now already offset, so this calculation will be correct.
          const position = calculatePopupPosition(currentStep, targetRect, elementNotFound, popupWidth, popupHeight);
          setPopupPosition(position);
          setIsPopupVisible(true); 
          console.log(`[TourDebug] Popup for "${currentStep.title}" positioned and made visible.`);
        };

        if (popupHeight === 0 || popupWidth === 0) {
            const timer = setTimeout(() => {
                if (popupRef.current) { 
                    popupHeight = popupRef.current.offsetHeight;
                    popupWidth = popupRef.current.offsetWidth;
                    if (popupHeight > 0 && popupWidth > 0) {
                        positionAndShow();
                    } else {
                        setIsPopupVisible(false); 
                    }
                }
            }, 50); 
            return () => clearTimeout(timer);
        } else {
            positionAndShow();
        }
      }
    } else {
      if (isPopupVisible) setIsPopupVisible(false); 
    }
  }, [isOpen, currentStep, targetRect, isHighlightVisible, elementNotFound, isProcessingStepAction, isFindingElement, calculatePopupPosition, isPopupVisible]);

  if (!isOpen || !currentStep) return null;

  const highlightPad = (currentStep.isModal || elementNotFound || !targetRect || !isHighlightVisible) ? 0 : (currentStep.highlightPadding ?? HIGHLIGHT_PADDING);
  let overlayPath = `M0,0 H${window.innerWidth} V${window.innerHeight} H0 Z`;
  const shouldDrawCutout = !currentStep.isModal && !elementNotFound && targetRect && isHighlightVisible;

  if (shouldDrawCutout) {
    // targetRect already contains the offset, so we can use its properties directly.
    const rLeft = targetRect.left;
    const rTop = targetRect.top;
    const rWidth = targetRect.width;
    const rHeight = targetRect.height;
    overlayPath = `M0,0 H${window.innerWidth} V${window.innerHeight} H0 Z M${rLeft - highlightPad},${rTop - highlightPad} h${rWidth + 2 * highlightPad} v${rHeight + 2 * highlightPad} h-${rWidth + 2 * highlightPad} Z`;
  }

  const isCurrentlyProcessingInternal = isProcessingStepAction || isFindingElement;

  return (
    <div ref={tourContainerRef} className="fixed inset-0 z-[100] flex items-center justify-center" aria-modal="true" role="dialog">
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <path d={overlayPath} fill="rgba(0,0,0,0.65)" fillRule="evenodd" 
              className={cn(isHighlightVisible ? "opacity-100 transition-opacity duration-200" : "opacity-0")} />
      </svg>
      <Card
        ref={popupRef}
        className={cn(
          "fixed z-[101] w-full max-w-sm shadow-2xl bg-popover text-popover-foreground transition-all duration-200 ease-out",
          isPopupVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
        style={{
          top: `${popupPosition.top}px`,
          left: `${popupPosition.left}px`,
          visibility: isPopupVisible ? 'visible' : 'hidden',
        }}
      >
        <CardHeader className="relative pb-3 pt-4">
          <CardTitle className="text-lg">{currentStep.title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={handleSkip} className="absolute top-2 right-2 h-7 w-7" aria-label="Skip tour" disabled={isCurrentlyProcessingInternal}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="text-sm pt-0 pb-4 min-h-[60px]">
          {isCurrentlyProcessingInternal && !elementNotFound && (currentStep.selector || currentStep.action) && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
              <span>{isProcessingStepAction ? (currentStep.action ? "Performing action..." : "Loading next step...") : "Locating element..."}</span>
            </div>
          )}
          {!isCurrentlyProcessingInternal && elementNotFound && !currentStep.isModal && (
            <div className="my-2 p-2 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-xs flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 shrink-0" />
              <p>Could not find or reveal: "{currentStep.selector || 'target element'}". Ensure it is visible or skip this step.</p>
            </div>
          )}
          {!isCurrentlyProcessingInternal && (!elementNotFound || currentStep.isModal) &&
            (typeof currentStep.content === 'string' ? <p>{currentStep.content}</p> : currentStep.content)
          }
        </CardContent>
        <CardFooter className="flex justify-between pt-3 pb-4">
          <div className="text-xs text-muted-foreground">Step {currentStepIndex + 1} of {steps.length}</div>
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev} disabled={isCurrentlyProcessingInternal}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="bg-primary hover:bg-primary/90" disabled={isCurrentlyProcessingInternal}>
              {isCurrentlyProcessingInternal ? <Loader2 className="h-4 w-4 animate-spin" /> : (currentStepIndex === steps.length - 1 ? 'Finish' : 'Next')}
              {!isCurrentlyProcessingInternal && currentStepIndex < steps.length - 1 && <ArrowRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
